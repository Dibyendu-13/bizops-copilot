import mongoose, { Schema } from "mongoose";

const DocumentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    text: { type: String, default: "" },
    summary: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Document = mongoose.models.Document || mongoose.model("Document", DocumentSchema);
