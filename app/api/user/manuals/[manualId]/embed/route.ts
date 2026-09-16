import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type RouteContext = { params: { manualId: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const embeddingUrl = process.env.MANUAL_SATHI_EMBEDDING_API_URL;
  const embeddingKey = process.env.MANUAL_SATHI_EMBEDDING_API_KEY;
  const embeddingModel = process.env.MANUAL_SATHI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  if (!embeddingUrl || !embeddingKey) {
    return NextResponse.json({ error: "Embeddings are not configured. Add MANUAL_SATHI_EMBEDDING_API_URL and MANUAL_SATHI_EMBEDDING_API_KEY." }, { status: 503 });
  }

  const { data: chunks, error: chunkError } = await supabase.from("manual_chunks").select("id, content").eq("manual_id", params.manualId).eq("user_id", user.id).is("embedding", null);
  if (chunkError) return NextResponse.json({ error: chunkError.message }, { status: 500 });
  if (!chunks?.length) return NextResponse.json({ manualId: params.manualId, status: "indexed", embedded: 0 });

  let embedded = 0;
  try {
    for (const chunk of chunks) {
      const response = await fetch(embeddingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
        body: JSON.stringify({ model: embeddingModel, input: chunk.content }),
      });
      if (!response.ok) throw new Error(`Embedding provider returned ${response.status}.`);
      const payload = (await response.json()) as { data?: { embedding?: number[] }[] };
      const embedding = payload.data?.[0]?.embedding;
      if (!embedding?.length) throw new Error("Embedding provider returned no vector.");
      const { error: updateError } = await supabase.from("manual_chunks").update({ embedding }).eq("id", chunk.id).eq("user_id", user.id);
      if (updateError) throw new Error(updateError.message);
      embedded += 1;
    }
  } catch (error) {
    console.error("Manual embedding failed.", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Manual embedding failed.", embedded }, { status: 502 });
  }
  return NextResponse.json({ manualId: params.manualId, status: "embedded", embedded });
}
