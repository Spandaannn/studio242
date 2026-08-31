import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin-session";

// FLM-13 — gates every /admin/** route (and, since Server Actions POST back
// to the same URL they're rendered on, this covers their mutations too — no
// per-page auth check is strictly required, though actions call
// requireAdminSession() anyway as defense-in-depth).
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookie(cookie);
  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
