# Manual Sathi

Frontend-first prototype for turning appliance manuals into clear, interactive help.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional AI provider

The app works without an API key by using the local mock manual knowledge base. To connect an OpenAI-compatible provider, copy `.env.example` to `.env.local` and fill in the provider values:

```env
MANUAL_SATHI_LLM_API_URL=https://api.openai.com/v1/chat/completions
MANUAL_SATHI_LLM_API_KEY=your-secret-key
MANUAL_SATHI_LLM_MODEL=your-model-name
```

Never commit `.env.local` or paste a secret key into source code or chat. Restart the development server after changing environment variables.

## API seams

- `GET /api/health` reports whether an external chat provider is configured.
- `POST /api/chat` retrieves relevant mock manual context and optionally calls an OpenAI-compatible provider.
- `POST /api/manuals` validates prototype uploads without persistence.
- `POST /api/user/manuals/:manualId/process` downloads an owned manual, calls the configured OCR provider, stores extracted chunks, and updates processing status.
- `POST /api/user/manuals/:manualId/embed` creates vectors for extracted chunks.
- `POST /api/user/manuals/:manualId/search` embeds a query and uses the Supabase pgvector RPC to retrieve relevant chunks.
- `POST /api/chat` accepts an optional `manualId`; when the user is authenticated and embeddings are configured, it retrieves owned manual chunks before generating the answer.

## Current implementation status

Completed for the frontend-first prototype:

- Responsive dashboard, appliance detail, manual reader, and AI assistant
- Desktop sidebar and mobile navigation
- Search, local appliance persistence, voice input, and text-to-speech
- Mock manuals for Samsung, LG, Xiaomi, and Huawei
- Validated upload interaction with drag-and-drop
- Typed chat and upload API boundaries
- Optional environment-based LLM provider adapter

Still required for production:

- Authentication and a database
- Object storage for uploaded manuals
- OCR and document chunking
- Vector embeddings and retrieval
- Production LLM safety/evaluation
- Real deployment secrets and Vercel configuration

## Supabase foundation

The initial production schema is in [`supabase/schema.sql`](./supabase/schema.sql). It defines user-owned appliances, uploaded manuals, extracted manual chunks, vector embeddings, and row-level security policies.

After creating a Supabase project:

1. Run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local`.
3. Add the project URL and anon key.
4. Restart the Next.js server.

The app remains usable with mock data when Supabase variables are not configured.

Authentication endpoints are available at `/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/sign-out`, and `/api/auth/me`. Auth sessions are stored in Supabase SSR cookies once the environment variables are configured.

Authenticated appliance persistence is available at `GET/POST /api/user/appliances`. Requests return `503` in demo mode and require a signed-in Supabase user when configured. The frontend intentionally continues using mock/local data until the storage and OCR pipeline is connected.

Authenticated manual storage is available at `POST /api/user/manuals`. The schema creates a private Supabase Storage bucket named `manuals` and adds user-folder policies. The route validates ownership, uploads the file, and creates a `manuals` table row; OCR and indexing remain separate processing steps.

## What you need to configure

You do not need to send credentials in chat. When ready, create `D:\Hackathon\.env.local` locally and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
MANUAL_SATHI_LLM_API_URL=your-openai-compatible-chat-endpoint
MANUAL_SATHI_LLM_API_KEY=your-provider-key
MANUAL_SATHI_LLM_MODEL=your-model-name
MANUAL_SATHI_OCR_API_URL=your-ocr-endpoint
MANUAL_SATHI_OCR_API_KEY=your-ocr-key
MANUAL_SATHI_EMBEDDING_API_URL=your-embedding-endpoint
MANUAL_SATHI_EMBEDDING_API_KEY=your-embedding-key
MANUAL_SATHI_EMBEDDING_MODEL=text-embedding-3-small
```

For Vercel, add the same values under **Project Settings → Environment Variables**. Never add secret values to source files, screenshots, or chat messages.
