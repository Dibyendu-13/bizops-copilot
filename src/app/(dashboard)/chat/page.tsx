"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";

type AgentStep = {
  name: "Research Agent" | "Draft Agent" | "Critic Agent" | "Final Answer" | string;
  summary?: string;
  content?: string;
  details?: string[];
};

type Message = {
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  trace?: AgentStep[];
};

const suggestions = [
  "Research the latest pricing trends for SMB CRM software",
  "Remember my name is David and help me later",
  "Summarize the key actions from a customer follow-up",
  "Find recent market news about AI sales tools",
];

function TraceCard({ step, defaultOpen = false }: { step: AgentStep; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const title = step.name;
  const body = step.summary || step.content || "";
  const details = step.details || [];
  const content = step.content || "";
  const iconSrc =
    title === "Research Agent"
      ? "/research-agent.png"
      : title === "Draft Agent"
        ? "/draft-agent.png"
        : "/critic-agent.png";
  const accent =
    title === "Research Agent"
      ? "border-cyan-300/20 bg-cyan-300/5"
      : title === "Draft Agent"
        ? "border-amber-300/20 bg-amber-300/5"
        : "border-rose-300/20 bg-rose-300/5";
  const badge =
    title === "Research Agent"
      ? "bg-cyan-300/15 text-cyan-100"
      : title === "Draft Agent"
        ? "bg-amber-300/15 text-amber-100"
        : "bg-rose-300/15 text-rose-100";

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`group rounded-2xl border px-3 py-3 ${accent}`}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                <img src={iconSrc} alt={`${title} icon`} className="h-full w-full object-cover" />
              </div>
            <div>
              <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${badge}`}>
                {title}
              </div>
              {body ? <div className="mt-1 line-clamp-2 text-sm text-slate-200">{body}</div> : null}
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition group-open:bg-white/10">
            {open ? "Hide" : "Show"}
          </div>
        </div>
      </summary>
      {details.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-300">
          {details.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-xl bg-white/5 px-3 py-2 leading-5">
              {item}
            </li>
          ))}
        </ul>
      ) : content ? (
        <div className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-slate-300">
          <AssistantMarkdown content={content} />
        </div>
      ) : null}
    </details>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-100">{children}</em>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li className="leading-6">{children}</li>,
        h1: ({ children }) => <h1 className="mb-3 text-lg font-semibold text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-3 text-base font-semibold text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-cyan-200 underline decoration-cyan-200/50 underline-offset-2">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-white/10">{children}</tr>,
        th: ({ children }) => <th className="px-3 py-2 font-semibold text-white">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 align-top text-slate-200">{children}</td>,
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-cyan-300/40 pl-4 italic text-slate-300">{children}</blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-white/10 px-1 py-0.5 text-[0.95em] text-cyan-100">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function AgentTrace({ trace }: { trace: AgentStep[] }) {
  if (!trace.length) return null;

  const research = trace.find((step) => step.name === "Research Agent");
  const draft = trace.find((step) => step.name === "Draft Agent");
  const critic = trace.find((step) => step.name === "Critic Agent");
  const ordered = [research, draft, critic].filter(Boolean) as AgentStep[];
  const extra = trace.filter(
    (step) => !ordered.some((known) => known === step)
  );
  const allSteps = [...ordered, ...extra];

  return (
    <div className="mt-4 rounded-3xl border border-cyan-300/10 bg-cyan-300/5 p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80">Agent trace</div>
          <p className="mt-1 text-sm text-slate-300">Three-step workflow: Research, Draft, Critic.</p>
        </div>
        <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
          {ordered.length} agents
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {allSteps.map((step, index) => (
          <TraceCard
            key={`${step.name}-${index}`}
            step={step}
            defaultOpen={step.name === "Final Answer"}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [researchUsed, setResearchUsed] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [activeStage, setActiveStage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const urlChatId = new URLSearchParams(window.location.search).get("chatId");
    if (urlChatId) {
      setChatId(urlChatId);
      localStorage.setItem("m32_chat_id", urlChatId);
      return;
    }
    const saved = localStorage.getItem("m32_chat_id");
    if (saved) setChatId(saved);
  }, []);

  useEffect(() => {
    const syncChat = () => {
      const urlChatId = new URLSearchParams(window.location.search).get("chatId");
      if (urlChatId) {
        setChatId(urlChatId);
        return;
      }
      const saved = localStorage.getItem("m32_chat_id");
      if (saved) setChatId(saved);
    };
    const syncChatFromEvent = (event: Event) => {
      const custom = event as CustomEvent<{ chatId?: string }>;
      if (custom.detail?.chatId) {
        setChatId(custom.detail.chatId);
        return;
      }
      syncChat();
    };
    window.addEventListener("m32-chat-selected", syncChatFromEvent);
    window.addEventListener("popstate", syncChat);
    return () => {
      window.removeEventListener("m32-chat-selected", syncChatFromEvent);
      window.removeEventListener("popstate", syncChat);
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const loadChat = async () => {
      const cacheKey = `m32_chat_cache_${chatId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached) as { messages?: Message[] };
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
            return;
          }
        } catch {
          // Ignore malformed cache and fall through to fetch.
        }
      }

      const res = await fetch(`/api/chats/${chatId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    };
    loadChat();
  }, [chatId]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatId, messages.length]);

  const preview = useMemo(() => messages.slice(-4), [messages]);

  const send = async (value?: string) => {
    const text = (value ?? input).trim();
    if (!text || loading) return;
    setLoading(true);
    setActiveStage("Preparing workflow");
    setInput("");

    setMessages((current) => [
      ...current,
      { role: "user" as const, content: text },
      { role: "assistant" as const, content: "" },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message: text, multiAgentMode }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let assistantTrace: AgentStep[] = [];
    let latestChatId = chatId;
    let latestChatTitle = "";

    const flush = () => {
      if (!assistantText && assistantTrace.length === 0) return;
      setMessages((current) => {
        const copy = [...current];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          last.content = assistantText;
          last.trace = assistantTrace.length ? assistantTrace : last.trace;
        }
        return copy;
      });
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as
          | { type: "meta"; chatId?: string; researchUsed?: boolean; trace?: AgentStep[] }
          | { type: "trace"; step?: AgentStep; trace?: AgentStep[] }
          | { type: "token"; token: string }
          | { type: "done"; chatTitle?: string }
          | { type: "error"; error: string };

        if (event.type === "meta") {
          if (event.chatId) latestChatId = event.chatId;
          setResearchUsed(Boolean(event.researchUsed));
          setActiveStage(multiAgentMode ? "Research Agent running" : "Single Agent mode");
          if (Array.isArray(event.trace)) {
            assistantTrace = event.trace;
            flush();
          }
        } else if (event.type === "trace") {
          if (Array.isArray(event.trace)) {
            assistantTrace = event.trace;
            setActiveStage("Final answer assembling");
            flush();
          } else if (event.step) {
            assistantTrace = [...assistantTrace, event.step];
            setActiveStage(event.step.name);
            flush();
          }
        } else if (event.type === "token") {
          assistantText += event.token;
          flush();
        } else if (event.type === "done") {
          if (event.chatTitle) {
            latestChatTitle = event.chatTitle;
          }
        } else if (event.type === "error") {
          assistantText = event.error;
          flush();
        }
      }
    }

    if (latestChatId) {
      setChatId(latestChatId);
      localStorage.setItem("m32_chat_id", latestChatId);
    }
    flush();
    setActiveStage("");
    if (latestChatId) {
      window.dispatchEvent(
        new CustomEvent("m32-chat-title-updated", {
          detail: { chatId: latestChatId, title: latestChatTitle || "New chat" },
        })
      );
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-0 gap-3 lg:h-[calc(100dvh-2rem)] lg:grid-cols-[260px,1fr] lg:gap-4 lg:overflow-hidden">
      <section className="hidden min-h-0 min-w-0 flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glow lg:flex lg:h-full lg:overflow-y-auto lg:p-5 lg:pr-4">
        <div className="min-w-0 text-sm uppercase tracking-[0.2em] text-cyan-200/80">Workbench</div>
        <h2 className="mt-2 min-w-0 text-xl font-semibold leading-tight">Business Copilot</h2>
        <p className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-300">
          Chat, remember facts, and trigger research mode with real web search snippets.
        </p>
        <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Session memory</div>
          <p className="mt-2 break-words text-sm leading-6 text-slate-200">
            The assistant keeps track of what you say within this thread.
          </p>
          <div className="mt-3 break-words text-xs leading-5 text-slate-400">
            {chatId ? `Chat ID: ${chatId}` : "A new chat will be created on first message."}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Try this</div>
          <div className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3 text-left text-sm leading-5 text-slate-200 transition hover:bg-white/10"
              >
                <span className="block break-words">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glow lg:min-h-0">
        <div className="shrink-0 border-b border-white/10 px-4 py-4 md:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Chat</h1>
              <p className="text-sm text-slate-300">
                Ask a question, tell it your name, or prefix a request with “research” for web-backed answers.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setMultiAgentMode((value) => !value)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  multiAgentMode ? "bg-cyan-300/15 text-cyan-100" : "bg-white/5 text-slate-300"
                }`}
              >
                {multiAgentMode ? "Multi-Agent Mode" : "Single Agent Mode"}
              </button>
              <div className={`rounded-full px-3 py-1 text-xs ${researchUsed ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-slate-300"}`}>
                {researchUsed ? "Research used" : "Research idle"}
              </div>
            </div>
          </div>
          {loading && activeStage ? (
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {activeStage}
            </div>
          ) : null}
        </div>

        <div ref={scrollAreaRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-center md:p-8">
              <div className="text-lg font-medium">Start the conversation</div>
              <p className="mt-2 text-sm text-slate-300">
                Example: “My name is David” then ask “What is my name?”
              </p>
            </div>
          ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-3xl px-4 py-4 sm:px-5 sm:py-4 lg:px-6 lg:py-5 ${
                      m.role === "user"
                        ? "ml-auto w-full max-w-[92%] bg-cyan-300 text-slate-900 sm:max-w-[84%] lg:max-w-[78%] xl:max-w-[74%]"
                        : "w-full max-w-[94%] border border-white/5 bg-slate-950/40 sm:max-w-[88%] lg:max-w-[84%] xl:max-w-[80%]"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] opacity-60">
                      {m.role === "user" ? "You" : "M32 Copilot"}
                      {m.toolName ? ` · ${m.toolName}` : ""}
                    </div>
                    <div className="mt-2 text-sm leading-6 md:text-[15px]">
                      {m.content ? (
                        <AssistantMarkdown content={m.content} />
                      ) : m.role === "assistant" && loading ? (
                        "Thinking..."
                      ) : null}
                    </div>
                    {m.role === "assistant" && Array.isArray(m.trace) && m.trace.length > 0 ? (
                      <AgentTrace trace={m.trace} />
                    ) : null}
                  </div>
                ))
          )}

          {preview.length > 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-400">
              Recent context is visible in this thread, which helps with follow-up questions.
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-white/10 p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[52px] flex-1 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-500 md:text-base"
              placeholder="Ask a business question, or type 'research: ...'"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
