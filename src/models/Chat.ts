import mongoose, { Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" },
    summary: { type: String, default: "" },
    lastMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
