import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session";

// Next.js 16: proxy.ts is the middleware.ts convention.
// Signature check only — account existence is checked in pages.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && process.env.SESSION_JWT_SECRET) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.SESSION_JWT_SECRET)
      );
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "?auth=required";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/install/:path*",
    "/billing/:path*",
    "/preview/:path*",
  ],
};
