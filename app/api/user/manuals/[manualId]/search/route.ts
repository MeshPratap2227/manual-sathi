import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type RouteContext = { params: { manualId: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: { query?: string; limit?: number };
  try { body = (await request.json()) as typeof body; } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "A search query is required." }, { status: 400 });

  const embeddingUrl = process.env.MANUAL_SATHI_EMBEDDING_API_URL;
  const embeddingKey = process.env.MANUAL_SATHI_EMBEDDING_API_KEY;
  const embeddingModel = process.env.MANUAL_SATHI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  if (!embeddingUrl || !embeddingKey) return NextResponse.json({ error: "Embeddings are not configured." }, { status: 503 });

  const response = await fetch(embeddingUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
    body: JSON.stringify({ model: embeddingModel, input: query }),
  });
  if (!response.ok) return NextResponse.json({ error: `Embedding provider returned ${response.status}.` }, { status: 502 });
  const payload = (await response.json()) as { data?: { embedding?: number[] }[] };
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding?.length) return NextResponse.json({ error: "Embedding provider returned no vector." }, { status: 502 });

  const { data, error } = await supabase.rpc("match_manual_chunks", {
    query_embedding: embedding,
    match_manual_id: params.manualId,
    match_user_id: user.id,
    match_count: Math.min(Math.max(body.limit ?? 5, 1), 20),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
