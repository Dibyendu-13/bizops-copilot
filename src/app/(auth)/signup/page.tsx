"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) return setError("Could not create account");
    router.push("/chat");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
        <h1 className="text-3xl font-semibold">Create account</h1>
        <input className="mt-6 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/40 p-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <button className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 font-medium text-slate-900">Sign up</button>
        <p className="mt-4 text-sm text-slate-400">Already have an account? <Link className="text-cyan-200" href="/login">Log in</Link></p>
      </form>
    </main>
  );
}
