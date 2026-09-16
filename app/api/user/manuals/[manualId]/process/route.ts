import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type RouteContext = { params: { manualId: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: manual, error: manualError } = await supabase
    .from("manuals")
    .select("id, storage_path, mime_type, status")
    .eq("id", params.manualId)
    .eq("user_id", user.id)
    .single();
  if (manualError || !manual) return NextResponse.json({ error: "Manual was not found for this user." }, { status: 404 });

  const ocrUrl = process.env.MANUAL_SATHI_OCR_API_URL;
  const ocrKey = process.env.MANUAL_SATHI_OCR_API_KEY;
  if (!ocrUrl || !ocrKey) {
    return NextResponse.json({ error: "OCR is not configured. Add MANUAL_SATHI_OCR_API_URL and MANUAL_SATHI_OCR_API_KEY before processing manuals." }, { status: 503 });
  }

  await supabase.from("manuals").update({ status: "processing" }).eq("id", manual.id).eq("user_id", user.id);
  try {
    const { data: file, error: downloadError } = await supabase.storage.from("manuals").download(manual.storage_path);
    if (downloadError || !file) throw new Error(downloadError?.message ?? "Stored manual could not be downloaded.");

    const form = new FormData();
    form.append("file", file, manual.storage_path.split("/").pop() ?? "manual");
    form.append("mime_type", manual.mime_type);
    const response = await fetch(ocrUrl, { method: "POST", headers: { Authorization: `Bearer ${ocrKey}` }, body: form });
    if (!response.ok) throw new Error(`OCR provider returned ${response.status}.`);
    const result = (await response.json()) as { text?: string; pages?: { page: number; text: string }[] };
    if (!result.text && !result.pages?.length) throw new Error("OCR provider returned no extracted text.");

    const chunks = result.pages?.length
      ? result.pages.map((page) => ({ manual_id: manual.id, user_id: user.id, content: page.text, page_number: page.page }))
      : [{ manual_id: manual.id, user_id: user.id, content: result.text!, page_number: null }];
    const { error: chunkError } = await supabase.from("manual_chunks").insert(chunks);
    if (chunkError) throw new Error(chunkError.message);
    const { error: updateError } = await supabase.from("manuals").update({ status: "indexed", page_count: result.pages?.length ?? null }).eq("id", manual.id).eq("user_id", user.id);
    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ manualId: manual.id, status: "indexed", chunks: chunks.length });
  } catch (error) {
    await supabase.from("manuals").update({ status: "failed" }).eq("id", manual.id).eq("user_id", user.id);
    console.error("Manual processing failed.", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Manual processing failed." }, { status: 502 });
  }
}
