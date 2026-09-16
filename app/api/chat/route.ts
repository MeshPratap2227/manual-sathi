import { NextResponse } from "next/server";
import { answerWithOptionalProvider, retrieveKnowledge } from "@/lib/assistant";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ChatRequest = {
  message?: string;
  applianceId?: string;
  manualId?: string;
};

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const applianceId = body.applianceId ?? "samsung-washer";
  const result = retrieveKnowledge(message, applianceId);
  if (!result && !body.manualId) {
    return NextResponse.json({ error: "No manual knowledge is available for this appliance yet." }, { status: 404 });
  }

  let retrievedContext: string[] = [];
  const supabase = createSupabaseServerClient();
  if (supabase && body.manualId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const embeddingUrl = process.env.MANUAL_SATHI_EMBEDDING_API_URL;
      const embeddingKey = process.env.MANUAL_SATHI_EMBEDDING_API_KEY;
      const embeddingModel = process.env.MANUAL_SATHI_EMBEDDING_MODEL ?? "text-embedding-3-small";
      if (embeddingUrl && embeddingKey) {
        try {
          const embeddingResponse = await fetch(embeddingUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${embeddingKey}` },
            body: JSON.stringify({ model: embeddingModel, input: message }),
          });
          if (embeddingResponse.ok) {
            const embeddingPayload = (await embeddingResponse.json()) as { data?: { embedding?: number[] }[] };
            const embedding = embeddingPayload.data?.[0]?.embedding;
            if (embedding?.length) {
              const { data: matches } = await supabase.rpc("match_manual_chunks", {
                query_embedding: embedding,
                match_manual_id: body.manualId,
                match_user_id: user.id,
                match_count: 5,
              });
              retrievedContext = (matches ?? []).map((match: { content: string; page_number?: number }) =>
                `Page ${match.page_number ?? "unknown"}: ${match.content}`,
              );
            }
          }
        } catch (error) {
          console.error("Manual retrieval failed; continuing with available context.", error);
        }
      }
    }
  }

  const contextEntry = result ?? {
    applianceId,
    title: "Uploaded appliance manual",
    page: 1,
    keywords: [],
    answer: "I found your uploaded manual. Ask a specific question and I’ll use the indexed sections to guide you safely.",
    steps: [],
  };
  let generated;
  try {
    generated = await answerWithOptionalProvider(message, contextEntry, retrievedContext);
  } catch (error) {
    console.error("Manual Sathi assistant provider failed; using local answer.", error);
    generated = { answer: contextEntry.answer, provider: "local-fallback" as const };
  }

  return NextResponse.json({
    answer: generated.answer,
    sources: [{ title: contextEntry.title, page: contextEntry.page, applianceId: contextEntry.applianceId }],
    steps: contextEntry.steps,
    provider: generated.provider,
    retrievedChunks: retrievedContext.length,
  });
}
