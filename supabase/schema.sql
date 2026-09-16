create extension if not exists "vector";

create table if not exists public.appliances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  model text not null,
  appliance_type text not null,
  room text,
  created_at timestamptz not null default now()
);

create table if not exists public.manuals (
  id uuid primary key default gen_random_uuid(),
  appliance_id uuid not null references public.appliances(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'indexed', 'failed')),
  page_count integer,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references public.manuals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  page_number integer,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists manual_chunks_manual_id_idx on public.manual_chunks(manual_id);
create index if not exists manual_chunks_embedding_idx on public.manual_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function public.match_manual_chunks(
  query_embedding vector(1536),
  match_manual_id uuid,
  match_user_id uuid,
  match_count integer default 5
)
returns table (
  id uuid,
  content text,
  page_number integer,
  similarity float
)
language sql stable
as $$
  select
    manual_chunks.id,
    manual_chunks.content,
    manual_chunks.page_number,
    1 - (manual_chunks.embedding <=> query_embedding) as similarity
  from public.manual_chunks
  where manual_chunks.manual_id = match_manual_id
    and manual_chunks.user_id = match_user_id
    and manual_chunks.embedding is not null
  order by manual_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Create a private Storage bucket named "manuals" in the Supabase dashboard.
insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', false)
on conflict (id) do nothing;

create policy "Users can upload manuals into their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own manuals"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own manuals"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'manuals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

alter table public.appliances enable row level security;
alter table public.manuals enable row level security;
alter table public.manual_chunks enable row level security;

create policy "Users can manage their appliances"
  on public.appliances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their manuals"
  on public.manuals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their manual chunks"
  on public.manual_chunks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
