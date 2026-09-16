import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("appliances").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appliances: data });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: { brand?: string; model?: string; applianceType?: string; room?: string };
  try { body = (await request.json()) as typeof body; } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const brand = body.brand?.trim();
  const model = body.model?.trim();
  const applianceType = body.applianceType?.trim();
  if (!brand || !model || !applianceType) return NextResponse.json({ error: "Brand, model, and appliance type are required." }, { status: 400 });
  const { data, error } = await supabase.from("appliances").insert({ user_id: user.id, brand, model, appliance_type: applianceType, room: body.room?.trim() || null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appliance: data }, { status: 201 });
}
