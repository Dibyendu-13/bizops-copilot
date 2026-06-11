import pdf from "pdf-parse";

export async function extractTextFromUpload(file: File) {
  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (mimeType.includes("pdf")) {
    const parsed = await pdf(buffer);
    return parsed.text || "";
  }

  if (mimeType.startsWith("text/") || mimeType.includes("json") || file.name.match(/\.(md|csv|txt|log|eml)$/i)) {
    return buffer.toString("utf8");
  }

  return buffer.toString("utf8");
}

export function makeDocumentSummary(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.slice(0, 500);
}

export function buildDocumentContext(text: string, maxChars = 4000) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxChars);
}
