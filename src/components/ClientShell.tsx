"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createFreshChat } from "@/lib/chat";

type ChatItem = {
  id: string;
  title: string;
  updatedAt: string;
  isDefault?: boolean;
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
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [chatMenuOpenId, setChatMenuOpenId] = useState("");
  const [renameChatId, setRenameChatId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [deleteChatId, setDeleteChatId] = useState("");
  const [pinnedChatId, setPinnedChatId] = useState("");
  const [pinnedChatTitle, setPinnedChatTitle] = useState("New chat");

  const getChatStorageKey = (id?: string) => `m32_chat_id_${id || userId || "anonymous"}`;

  const loadChats = async () => {
    setLoadingChats(true);
    const res = await fetch("/api/chats", { cache: "no-store" });
    const data = await res.json();
    const sortedChats = [...(data.chats || [])].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const defaultChat = sortedChats.find((chat) => chat.id === data.defaultChatId || chat.isDefault);
    const defaultChatId = defaultChat?.id || data.defaultChatId || "";
    setPinnedChatId(defaultChatId);
    setPinnedChatTitle(defaultChat?.title || "New chat");
    setChats(sortedChats.filter((chat) => chat.id !== defaultChatId));
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
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setUserId(data.user?.userId || "");
        setUserName(data.user?.name || "");
      } catch {
        // Ignore profile lookup errors; the app still works.
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadChats();
    const current = new URLSearchParams(window.location.search).get("chatId") || "";
    setSelectedChatId(current);
  }, [userId]);

  useEffect(() => {
    const refreshChats = () => {
      loadChats();
    };
    window.addEventListener("m32-chats-updated", refreshChats);
    return () => window.removeEventListener("m32-chats-updated", refreshChats);
  }, []);

  useEffect(() => {
    const syncSelectedChat = () => {
      const current = new URLSearchParams(window.location.search).get("chatId") || "";
      setSelectedChatId(current);
    };
    window.addEventListener("m32-chat-selected", syncSelectedChat);
    return () => {
      window.removeEventListener("m32-chat-selected", syncSelectedChat);
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
    localStorage.removeItem(getChatStorageKey());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const goToChat = (chatId: string) => {
    localStorage.setItem(getChatStorageKey(), chatId);
    setSelectedChatId(chatId);
    if (pathname.startsWith("/chat")) {
      window.history.pushState({}, "", `/chat?chatId=${chatId}`);
      window.dispatchEvent(new CustomEvent("m32-chat-selected", { detail: { chatId } }));
      return;
    }
    router.push(`/chat?chatId=${chatId}`);
  };

  const newChat = async () => {
    if (pinnedChatId) {
      goToChat(pinnedChatId);
      return;
    }
    const chat = await createFreshChat("New chat", true);
    if (!chat?.id) return;
    setPinnedChatId(chat.id);
    setPinnedChatTitle(chat.title || "New chat");
    goToChat(chat.id);
    await loadChats();
  };

  const openChat = (chatId: string) => {
    goToChat(chatId);
    setMobileMenuOpen(false);
    setChatMenuOpenId("");
  };

  const renameChat = (chatId: string) => {
    const current = chats.find((chat) => chat.id === chatId);
    const pinned = pinnedChatId === chatId ? { id: pinnedChatId, title: pinnedChatTitle } : null;
    setRenameChatId(chatId);
    setRenameValue(current?.title || pinned?.title || "New chat");
    setChatMenuOpenId("");
  };

  const submitRenameChat = async () => {
    const nextTitle = renameValue.trim();
    if (!renameChatId || !nextTitle) return;
    const current = chats.find((chat) => chat.id === renameChatId);
    if (nextTitle === current?.title) {
      setRenameChatId("");
      setRenameValue("");
      return;
    }
    const res = await fetch(`/api/chats/${renameChatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.chat?.id) {
      setChats((currentChats) =>
        currentChats.map((chat) => (chat.id === data.chat.id ? { ...chat, title: data.chat.title } : chat))
      );
      if (data.chat.id === pinnedChatId) setPinnedChatTitle(data.chat.title);
      window.dispatchEvent(
        new CustomEvent("m32-chat-title-updated", {
          detail: { chatId: data.chat.id, title: data.chat.title },
        })
      );
    }
    setRenameChatId("");
    setRenameValue("");
  };

  const deleteChat = (chatId: string) => {
    setDeleteChatId(chatId);
    setChatMenuOpenId("");
  };

  const confirmDeleteChat = async () => {
    if (!deleteChatId) return;
    const res = await fetch(`/api/chats/${deleteChatId}`, { method: "DELETE" });
    if (!res.ok) return;
    setChats((currentChats) => currentChats.filter((chat) => chat.id !== deleteChatId));
    if (selectedChatId === deleteChatId) {
      setSelectedChatId("");
      localStorage.removeItem(getChatStorageKey(deleteChatId));
    }
    window.dispatchEvent(new Event("m32-chats-updated"));
    setDeleteChatId("");
  };

  const cancelDeleteChat = () => setDeleteChatId("");

  const cancelRenameChat = () => {
    setRenameChatId("");
    setRenameValue("");
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
          className={`fixed inset-y-0 left-0 z-50 h-dvh w-[88vw] max-w-sm transform overflow-hidden border-r border-white/10 bg-slate-950 p-5 shadow-2xl transition-transform duration-200 md:static md:z-auto md:flex md:h-full md:w-80 md:shrink-0 md:flex-col md:overflow-hidden md:border-r md:bg-white/5 md:p-6 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0">
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
            </div>

            <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent chats</h3>
                <button onClick={loadChats} className="text-xs text-cyan-200">
                  Refresh
                </button>
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {loadingChats ? <div className="text-sm text-slate-400">Loading chats...</div> : null}
                {pinnedChatId ? (
                  <div
                    data-chat-id={pinnedChatId}
                    className={`relative rounded-2xl border transition ${
                      selectedChatId === pinnedChatId
                        ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                        : "border-white/10 bg-slate-950/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-2 px-4 py-3">
                      <button
                        onClick={() => openChat(pinnedChatId)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-sm font-medium leading-5 text-slate-200">{pinnedChatTitle}</div>
                        <div className="mt-1 text-xs text-slate-400">Start a fresh conversation</div>
                      </button>
                      <button
                        type="button"
                        aria-label="Chat options"
                        onClick={() => setChatMenuOpenId((current) => (current === pinnedChatId ? "" : pinnedChatId))}
                        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        ⋯
                      </button>
                    </div>
                    {chatMenuOpenId === pinnedChatId ? (
                      <div className="absolute right-2 top-12 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
                        <button
                          onClick={() => renameChat(pinnedChatId)}
                          className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10"
                        >
                          Rename chat
                        </button>
                        <button
                          onClick={() => deleteChat(pinnedChatId)}
                          className="block w-full px-4 py-3 text-left text-sm text-rose-200 hover:bg-white/10"
                        >
                          Delete chat
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {!loadingChats && chats.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
                    Your chat history will appear here.
                  </div>
                ) : null}
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`relative rounded-2xl border transition ${
                      selectedChatId === chat.id
                        ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                        : "border-white/10 bg-slate-950/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-2 px-4 py-3">
                      <button
                        onClick={() => openChat(chat.id)}
                        onMouseEnter={() => prefetchChat(chat.id)}
                        onMouseDown={() => prefetchChat(chat.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="line-clamp-2 text-sm font-medium leading-5">{chat.title || "New chat"}</div>
                      </button>
                      <button
                        type="button"
                        aria-label="Chat options"
                        onClick={() => setChatMenuOpenId((current) => (current === chat.id ? "" : chat.id))}
                        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        ⋯
                      </button>
                    </div>
                    {chatMenuOpenId === chat.id ? (
                      <div className="absolute right-2 top-12 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
                        <button
                          onClick={() => renameChat(chat.id)}
                          className="block w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10"
                        >
                          Rename chat
                        </button>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="block w-full px-4 py-3 text-left text-sm text-rose-200 hover:bg-white/10"
                        >
                          Delete chat
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-white/10 pt-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-sm font-semibold text-rose-200">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100">{userName || "Signed in account"}</div>
                  <div className="text-xs text-slate-400">Account and session controls</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-500/15"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        {renameChatId ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
              <div className="text-lg font-semibold">Rename chat</div>
              <p className="mt-1 text-sm text-slate-400">Give this conversation a clearer title.</p>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitRenameChat();
                  }
                  if (e.key === "Escape") cancelRenameChat();
                }}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                placeholder="Enter chat title"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={cancelRenameChat}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submitRenameChat()}
                  className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-900"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {deleteChatId ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
              <div className="text-lg font-semibold">Delete chat?</div>
              <p className="mt-1 text-sm text-slate-400">This cannot be undone.</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={cancelDeleteChat}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void confirmDeleteChat()}
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
