export async function createFreshChat(title = "New chat", fresh = false) {
  const res = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, fresh }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.chat?.id ? data.chat : null;
}
