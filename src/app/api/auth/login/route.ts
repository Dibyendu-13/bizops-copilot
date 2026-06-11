import { connectDB } from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  await connectDB();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("m32_token", token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
