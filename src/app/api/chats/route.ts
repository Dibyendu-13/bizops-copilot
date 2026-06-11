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

export async function GET(req: Request) {
  try {
    const user = getUser(req);
    await connectDB();
    const chats = await Chat.find({ userId: user.userId }).sort({ updatedAt: -1 }).lean();

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

    const requestedTitle = title || "New chat";
    if (requestedTitle === "New chat") {
      const existingBlank = await Chat.findOne({
        userId: user.userId,
        title: "New chat",
        lastMessage: "",
        summary: "",
      })
        .sort({ createdAt: -1 });

      if (existingBlank) {
        const hasMessages = await Message.exists({ chatId: existingBlank._id });
        if (!hasMessages) {
          return NextResponse.json({
            chat: {
              id: String(existingBlank._id),
              title: existingBlank.title,
              summary: existingBlank.summary,
              updatedAt: existingBlank.updatedAt,
            },
          });
        }
      }
    }

    const chat = await Chat.create({ userId: user.userId, title: requestedTitle });
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
