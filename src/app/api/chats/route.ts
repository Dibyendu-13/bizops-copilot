import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Chat } from "@/models/Chat";
import { ensureDefaultChat } from "@/lib/chat-default";
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
    const defaultChat = await ensureDefaultChat(user.userId);
    const chats = await Chat.find({ userId: user.userId }).sort({ isDefault: -1, updatedAt: -1 }).lean();

    return NextResponse.json({
      defaultChatId: defaultChat ? String(defaultChat._id) : "",
      chats: chats.map((chat) => {
        return {
          id: String(chat._id),
          title: chat.title,
          summary: chat.summary,
          isDefault: Boolean(chat.isDefault),
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
    const { title, fresh } = await req.json();
    await connectDB();

    const requestedTitle = title || "New chat";
    if (!fresh && requestedTitle === "New chat") {
      const existingDefault = await ensureDefaultChat(user.userId);
      if (existingDefault) {
        return NextResponse.json({
          chat: {
            id: String(existingDefault._id),
            title: existingDefault.title,
            summary: existingDefault.summary,
            updatedAt: existingDefault.updatedAt,
          },
        });
      }
    }

    const chatCount = await Chat.countDocuments({ userId: user.userId, isDefault: false });
    const chatTitle =
      fresh && requestedTitle === "New chat" ? `New chat ${chatCount + 1}` : requestedTitle;
    const chat = await Chat.create({
      userId: user.userId,
      title: chatTitle,
      isDefault: false,
    });
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
