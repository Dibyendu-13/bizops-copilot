"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ChatItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatPreviewPayload = {
  chat?: { id: string; title: string; summary: string; updatedAt: string };
  messages?: Array<{ id: string; role: string; content: string; toolName?: string; createdAt: string }>;
};

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [userName, setUserName] = useState("");

  const loadChats = async () => {
    setLoadingChats(true);
    const res = await fetch("/api/chats", { cache: "no-store" });
    const data = await res.json();
    const sortedChats = [...(data.chats || [])].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    setChats(sortedChats);
    setLoadingChats(false);
  };

  const prefetchChat = async (chatId: string) => {
    if (typeof window === "undefined") return;
    try {
      const cacheKey = `m32_chat_cache_${chatId}`;
      if (sessionStorage.getItem(cacheKey)) return;
      const res = await fetch(`/api/chats/${chatId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ChatPreviewPayload;
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // Ignore prefetch failures; click-time fetch will still work.
    }
  };

  useEffect(() => {
    loadChats();
    const current = new URLSearchParams(window.location.search).get("chatId") || localStorage.getItem("m32_chat_id") || "";
    setSelectedChatId(current);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setUserName(data.user?.name || "");
      } catch {
        // Ignore profile lookup errors; the app still works.
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const refreshChats = () => {
      loadChats();
    };
    window.addEventListener("m32-chats-updated", refreshChats);
    return () => window.removeEventListener("m32-chats-updated", refreshChats);
  }, []);

  useEffect(() => {
    const syncSelectedChat = () => {
      const current = new URLSearchParams(window.location.search).get("chatId") || localStorage.getItem("m32_chat_id") || "";
      setSelectedChatId(current);
    };
    window.addEventListener("m32-chat-selected", syncSelectedChat);
    window.addEventListener("m32-chats-updated", syncSelectedChat);
    return () => {
      window.removeEventListener("m32-chat-selected", syncSelectedChat);
      window.removeEventListener("m32-chats-updated", syncSelectedChat);
    };
  }, []);

  useEffect(() => {
    const updateChatTitle = (event: Event) => {
      const custom = event as CustomEvent<{ chatId?: string; title?: string }>;
      const chatId = custom.detail?.chatId;
      const title = custom.detail?.title;
      if (!chatId || !title) return;
      setChats((current) =>
        current.map((chat) => (chat.id === chatId ? { ...chat, title } : chat))
      );
    };

    window.addEventListener("m32-chat-title-updated", updateChatTitle);
    return () => window.removeEventListener("m32-chat-title-updated", updateChatTitle);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const newChat = async () => {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New chat" }),
    });
    const data = await res.json();
    if (data.chat?.id) {
      localStorage.setItem("m32_chat_id", data.chat.id);
      setSelectedChatId(data.chat.id);
      window.history.pushState({}, "", `/chat?chatId=${data.chat.id}`);
      window.dispatchEvent(new CustomEvent("m32-chat-selected", { detail: { chatId: data.chat.id } }));
      await loadChats();
    }
  };

  const openChat = (chatId: string) => {
    localStorage.setItem("m32_chat_id", chatId);
    setSelectedChatId(chatId);
    window.history.pushState({}, "", `/chat?chatId=${chatId}`);
    window.dispatchEvent(new CustomEvent("m32-chat-selected", { detail: { chatId } }));
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-dvh overflow-hidden text-white">
      <div className="mx-auto flex h-full max-w-7xl flex-col md:flex-row">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-4 md:hidden">
          <div>
            <div className="text-lg font-semibold">M32 Copilot</div>
            <div className="text-xs text-slate-400">Business AI assistant</div>
            {userName ? <div className="mt-1 text-xs text-cyan-200">Signed in as {userName}</div> : null}
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            Menu
          </button>
        </header>

        <aside
          className={`fixed inset-y-0 left-0 z-50 h-dvh w-[88vw] max-w-sm transform overflow-y-auto border-r border-white/10 bg-slate-950 p-5 shadow-2xl transition-transform duration-200 md:static md:z-auto md:flex md:h-full md:w-80 md:shrink-0 md:flex-col md:overflow-hidden md:border-r md:bg-white/5 md:p-6 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex items-center justify-between md:block">
            <div className="text-2xl font-semibold">M32 Copilot</div>
            {userName ? <div className="mt-2 text-sm text-cyan-200">Welcome, {userName}</div> : null}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm md:hidden"
            >
              Close
            </button>
          </div>

          <div className="mt-5 md:hidden">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Your chats, documents, and settings are all here. Use this panel to jump around quickly.
            </div>
          </div>

          <button
            onClick={newChat}
            className="mt-6 rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:opacity-90"
          >
            + New chat
          </button>

          <nav className="mt-6 space-y-2 text-sm">
            <Link
              className={`block rounded-xl px-4 py-3 ${pathname.startsWith("/chat") ? "bg-white/10" : ""}`}
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
            >
              Chat
            </Link>
            <Link
              className={`block rounded-xl px-4 py-3 ${pathname.startsWith("/documents") ? "bg-white/10" : ""}`}
              href="/documents"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documents
            </Link>
            <Link
              className={`block rounded-xl px-4 py-3 ${pathname.startsWith("/settings") ? "bg-white/10" : ""}`}
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>

          <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent chats</h3>
              <button onClick={loadChats} className="text-xs text-cyan-200">
                Refresh
              </button>
            </div>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loadingChats ? <div className="text-sm text-slate-400">Loading chats...</div> : null}
              {!loadingChats && chats.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
                  Your chat history will appear here.
                </div>
              ) : null}
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  onMouseEnter={() => prefetchChat(chat.id)}
                  onMouseDown={() => prefetchChat(chat.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedChatId === chat.id
                      ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                      : "border-white/10 bg-slate-950/30 hover:bg-white/10"
                  }`}
                >
                  <div className="line-clamp-2 text-sm font-medium leading-5">{chat.title || "New chat"}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={logout} className="mt-6 rounded-xl border border-white/10 px-4 py-3 text-left text-sm">
            Log out
          </button>
        </aside>

        {mobileMenuOpen ? (
          <button
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        ) : null}

        <main className="min-h-0 flex-1 overflow-hidden p-3">{children}</main>
      </div>
    </div>
  );
}
