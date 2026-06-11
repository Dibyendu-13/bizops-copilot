import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Document } from "@/models/Document";
import { NextResponse } from "next/server";
import { extractTextFromUpload, makeDocumentSummary } from "@/lib/documents";

function getUser(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.split("; ").find((c) => c.startsWith("m32_token="))?.split("=")[1];
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

export async function POST(req: Request) {
  try {
    const user = getUser(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    await connectDB();
    const text = await extractTextFromUpload(file);
    const doc = await Document.create({
      userId: user.userId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      text,
      summary: makeDocumentSummary(text),
      size: file.size,
    });

    return NextResponse.json({
      ok: true,
      document: {
        id: doc._id.toString(),
        filename: doc.filename,
        summary: doc.summary,
        size: doc.size,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
