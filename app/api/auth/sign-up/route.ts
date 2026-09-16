import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Use an email and a password with at least 8 characters." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data.user, session: data.session });
}
