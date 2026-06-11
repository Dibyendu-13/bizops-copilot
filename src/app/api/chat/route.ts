import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { Document } from "@/models/Document";
import { NextResponse } from "next/server";
import { buildDocumentContext } from "@/lib/documents";
import { runAgentWorkflow } from "@/lib/agents/workflow";
import { openai, modelName } from "@/lib/ai";

function getUser(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.split("; ").find((c) => c.startsWith("m32_token="))?.split("=")[1];
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

function encode(obj: Record<string, unknown>) {
  return `${JSON.stringify(obj)}\n`;
}

function normalizeTraceStep(step: { agent: string; summary: string; content: string; status: string }) {
  return {
    name: step.agent,
    summary: step.summary,
    content: step.content,
    status: step.status,
  };
}

async function generateChatTitle(userMessage: string, assistantReply: string) {
  const fallback = userMessage
    .replace(/\s+/g, " ")
    .replace(/^(research|search|find|look up)\s*:?\s*/i, "")
    .trim()
    .slice(0, 60);

  if (!process.env.OPENAI_API_KEY) return fallback || "New chat";

  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "Generate a short, natural chat title under 8 words. Use title case. Focus on the main topic of the conversation. Return only the title text.",
        },
        {
          role: "user",
          content: `User message: ${userMessage}\nAssistant reply: ${assistantReply}`,
        },
      ],
      temperature: 0.2,
    });
    const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "");
    return title || fallback || "New chat";
  } catch {
    return fallback || "New chat";
  }
}

export async function POST(req: Request) {
  const user = getUser(req);
  const { chatId, message, multiAgentMode = false } = await req.json();
  if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });
  await connectDB();

  const chat = chatId ? await Chat.findById(chatId) : await Chat.create({ userId: user.userId, title: message.slice(0, 40) });
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  await Message.create({ chatId: chat._id, userId: user.userId, role: "user", content: message });
  await Chat.findByIdAndUpdate(chat._id, {
    $set: {
      lastMessage: message,
      summary: message,
    },
  }, { timestamps: false });

  const recent = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 }).limit(20);
  const memory = recent
    .filter((m) => m.role === "user")
    .map((m) => `User said: ${m.content}`)
    .join("\n");

  const docs = await Document.find({ userId: user.userId }).sort({ createdAt: -1 }).limit(3).lean();
  const documentContext = docs.length
    ? docs
        .map((doc, i) => `${i + 1}. ${doc.filename}\nSummary: ${doc.summary}\nExcerpt: ${buildDocumentContext(doc.text)}`)
        .join("\n\n")
    : "";

  const shouldResearch = /^(research|search|find|look up)\b/i.test(message) || /\b(latest|news|compare|market|pricing)\b/i.test(message);

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  let answer = "";

  const send = async (payload: Record<string, unknown>) => {
    await writer.write(encoder.encode(encode(payload)));
  };

  (async () => {
    try {
      await send({ type: "meta", chatId: chat._id.toString() });

      const workflow = await runAgentWorkflow({
        message,
        memory,
        documentContext,
        shouldResearch,
        multiAgentMode,
      });

      await send({
        type: "trace",
        trace: workflow.trace.map(normalizeTraceStep),
        researchUsed: workflow.researchUsed,
      });

      let answer = "";
      for (const part of workflow.answer.split(/(\s+)/)) {
        answer += part;
        await send({ type: "token", token: part });
      }

      if (!answer) answer = "I’m sorry, I couldn’t generate a response.";
      await Message.create({ chatId: chat._id, userId: user.userId, role: "assistant", content: workflow.answer });
      const chatTitle = await generateChatTitle(message, workflow.answer);
      await Chat.findByIdAndUpdate(chat._id, {
        $set: {
          title: chatTitle,
          lastMessage: workflow.answer,
          summary: workflow.answer,
        },
      }, { timestamps: false });
      await send({
        type: "done",
        messageCount: await Message.countDocuments({ chatId: chat._id }),
        chatTitle,
      });
    } catch (error) {
      await send({ type: "error", error: error instanceof Error ? error.message : "Stream failed" });
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
