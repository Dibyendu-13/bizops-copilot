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

export async function GET(req: Request) {
  try {
    const user = getUser(req);
    await connectDB();
    const docs = await Document.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      documents: docs.map((doc) => ({
        id: String(doc._id),
        filename: doc.filename,
        mimeType: doc.mimeType,
        summary: doc.summary,
        size: doc.size,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load documents" },
      { status: 500 }
    );
  }
}
