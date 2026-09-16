import { NextResponse } from "next/server";

const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload must use multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A manual file is required." }, { status: 400 });
  }
  if (!supportedTypes.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPG, and PNG files are supported." }, { status: 415 });
  }
  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "Manual files must be 10 MB or smaller." }, { status: 413 });
  }

  return NextResponse.json({
    id: `manual-${Date.now()}`,
    fileName: file.name,
    pages: file.type === "application/pdf" ? 68 : null,
    status: "indexed",
    prototype: true,
    message: "Upload accepted. OCR and persistent indexing will be connected in the next phase.",
  });
}
