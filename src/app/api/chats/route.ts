import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Chat } from "@/models/Chat";
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
    const chats = await Chat.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      chats: chats.map((chat) => {
        return {
          id: String(chat._id),
          title: chat.title,
          summary: chat.summary,
          updatedAt: chat.updatedAt,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load chats" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = getUser(req);
    const { title } = await req.json();
    await connectDB();
    const chat = await Chat.create({ userId: user.userId, title: title || "New chat" });
    return NextResponse.json({
      chat: {
        id: String(chat._id),
        title: chat.title,
        summary: chat.summary,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create chat" },
      { status: 500 }
    );
  }
}
