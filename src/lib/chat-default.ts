import { Chat } from "@/models/Chat";

export async function ensureDefaultChat(userId: string) {
  let chat = await Chat.findOne({ userId, isDefault: true }).sort({ createdAt: -1 });

  if (!chat) {
    chat =
      (await Chat.findOne({ userId, title: "New chat" }).sort({ createdAt: 1 })) ||
      (await Chat.create({ userId, title: "New chat", isDefault: true }));

    if (chat && !chat.isDefault) {
      chat = await Chat.findByIdAndUpdate(chat._id, { $set: { isDefault: true } }, { new: true });
    }
  }

  return chat;
}
