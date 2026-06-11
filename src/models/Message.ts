import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "tool"], required: true },
    content: { type: String, required: true },
    toolName: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
