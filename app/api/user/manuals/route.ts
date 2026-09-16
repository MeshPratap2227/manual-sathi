import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload must use multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  const applianceId = formData.get("applianceId");
  if (!(file instanceof File) || typeof applianceId !== "string" || !applianceId) {
    return NextResponse.json({ error: "A manual file and appliance ID are required." }, { status: 400 });
  }
  if (!supportedTypes.has(file.type)) return NextResponse.json({ error: "Only PDF, JPG, and PNG files are supported." }, { status: 415 });
  if (file.size > maxFileSize) return NextResponse.json({ error: "Manual files must be 10 MB or smaller." }, { status: 413 });

  const { data: appliance, error: applianceError } = await supabase.from("appliances").select("id").eq("id", applianceId).eq("user_id", user.id).single();
  if (applianceError || !appliance) return NextResponse.json({ error: "Appliance was not found for this user." }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${applianceId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("manuals").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: manual, error: manualError } = await supabase.from("manuals").insert({
    appliance_id: applianceId,
    user_id: user.id,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    status: "uploaded",
  }).select().single();

  if (manualError) {
    await supabase.storage.from("manuals").remove([storagePath]);
    return NextResponse.json({ error: manualError.message }, { status: 500 });
  }
  return NextResponse.json({ manual }, { status: 201 });
}
