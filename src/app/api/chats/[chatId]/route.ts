import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { NextResponse } from "next/server";

function getUser(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.split("; ").find((c) => c.startsWith("m32_token="))?.split("=")[1];
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

export async function GET(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const user = getUser(req);
    const { chatId } = await context.params;
    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId: user.userId }).lean<{ _id: unknown; title: string; summary: string; updatedAt: Date }>();
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const messages = await Message.find({ chatId, userId: user.userId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      chat: {
        id: String(chat._id),
        title: chat.title,
        summary: chat.summary,
        updatedAt: chat.updatedAt,
      },
      messages: messages.map((message) => ({
        id: String(message._id),
        role: message.role,
        content: message.content,
        toolName: message.toolName || "",
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const user = getUser(req);
    const { chatId } = await context.params;
    await connectDB();
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: user.userId },
      { $set: { updatedAt: new Date() } },
      { new: true }
    ).lean<{ _id: unknown; title: string; summary: string; lastMessage?: string; updatedAt: Date }>();

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    return NextResponse.json({
      chat: {
        id: String(chat._id),
        title: chat.title,
        summary: chat.summary,
        lastMessage: chat.lastMessage || chat.summary || "",
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update chat" },
      { status: 500 }
    );
  }
}
