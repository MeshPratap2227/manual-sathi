import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "manual-sathi",
    chatProvider: process.env.MANUAL_SATHI_LLM_API_URL ? "configured" : "local",
    uploadMode: "prototype",
  });
}
