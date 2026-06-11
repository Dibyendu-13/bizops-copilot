import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="text-xl font-semibold tracking-wide">M32 Copilot</div>
          <div className="flex gap-3">
            <Link className="rounded-full border border-white/10 px-4 py-2" href="/login">Log in</Link>
            <Link className="rounded-full bg-cyan-300 px-4 py-2 text-slate-900" href="/signup">Get started</Link>
          </div>
        </header>
        <section className="grid gap-10 py-24 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-200">
              AI copilot for business operators
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight md:text-6xl">
              Turn business context into answers, drafts, and action.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Chat with a memory-aware assistant that can search the web, summarize documents, and help busy teams move faster.
            </p>
            <div className="mt-8 flex gap-3">
              <Link className="rounded-full bg-white px-5 py-3 text-slate-900" href="/signup">Start free</Link>
              <Link className="rounded-full border border-white/10 px-5 py-3" href="/chat">Open demo chat</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
            <div className="mb-4 text-sm text-slate-400">What it can do</div>
            <ul className="space-y-3 text-slate-200">
              <li>Remember user facts across the chat session</li>
              <li>Search the web and answer with citations</li>
              <li>Summarize business documents and emails</li>
              <li>Draft replies, action plans, and next steps</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
