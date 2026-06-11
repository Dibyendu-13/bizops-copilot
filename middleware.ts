import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("m32_token")?.value;
  const { pathname } = req.nextUrl;
  const protectedPaths = ["/app", "/chat", "/documents", "/settings", "/api/chat"];
  const authPaths = ["/login", "/signup"];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuth = authPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  if (isAuth && token && pathname === "/login") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/chat/:path*", "/documents/:path*", "/settings/:path*", "/login", "/signup", "/api/chat/:path*"],
};
