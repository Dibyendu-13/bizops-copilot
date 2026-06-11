import { connectDB } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) return NextResponse.json({ error: "User exists" }, { status: 409 });
  const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("m32_token", token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
