"use client";

import { useEffect, useState } from "react";

type Doc = {
  id: string;
  filename: string;
  summary: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDocuments = async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.documents || []);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/documents/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Upload failed");
      setUploading(false);
      return;
    }
    setMessage(`Uploaded ${data.document.filename}`);
    await loadDocuments();
    setUploading(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px,1fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow md:p-6">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Knowledge base</div>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Documents</h1>
        <p className="mt-3 text-sm text-slate-300">
          Upload files and the assistant will use them as context inside chat.
        </p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-950/30 px-5 py-8 text-center md:px-6 md:py-10">
          <span className="text-base font-medium md:text-lg">Upload a PDF, TXT, or MD file</span>
          <span className="mt-2 text-sm text-slate-400">The text is extracted and saved for later chat context.</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.csv,.json,.log,.eml,text/plain,application/pdf"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </label>

        {uploading ? <p className="mt-4 text-sm text-cyan-200">Uploading...</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold md:text-2xl">Uploaded files</h2>
            <p className="mt-1 text-sm text-slate-300">Latest uploads appear here automatically.</p>
          </div>
          <button
            onClick={loadDocuments}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {documents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/20 p-8 text-center text-slate-300">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map((doc) => (
              <article key={doc.id} className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{doc.filename}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{doc.mimeType}</p>
                  </div>
                  <div className="text-xs text-slate-400">{Math.round(doc.size / 1024)} KB</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {doc.summary || "No preview text extracted."}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
