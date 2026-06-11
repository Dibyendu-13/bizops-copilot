"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return setError("Invalid credentials");
    router.push("/chat");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
        <h1 className="text-3xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-slate-300">Welcome back.</p>
        <input className="mt-6 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 font-medium text-slate-900">Log in</button>
        <p className="mt-4 text-sm text-slate-400">No account? <Link className="text-cyan-200" href="/signup">Sign up</Link></p>
      </form>
    </main>
  );
}
