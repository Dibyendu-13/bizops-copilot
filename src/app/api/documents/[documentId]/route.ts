import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Document } from "@/models/Document";
import { NextResponse } from "next/server";

function getUser(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.split("; ").find((c) => c.startsWith("m32_token="))?.split("=")[1];
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

export async function DELETE(req: Request, context: { params: Promise<{ documentId: string }> }) {
  try {
    const user = getUser(req);
    const { documentId } = await context.params;
    await connectDB();

    const deleted = await Document.findOneAndDelete({ _id: documentId, userId: user.userId });
    if (!deleted) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete document" },
      { status: 500 }
    );
  }
}
