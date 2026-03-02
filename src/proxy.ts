import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const MASTER_EMAIL =
  (process.env.SUPER_ADMIN_EMAIL ?? "admin@eeytech.com.br").toLowerCase();
const ADMIN_APPLICATION_SLUG = "eeytech-admin";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isUnauthorizedPage = request.nextUrl.pathname.startsWith("/unauthorized");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  if (!token) {
    if (isLoginPage || isUnauthorizedPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  const isMaster = payload.email.toLowerCase() === MASTER_EMAIL;
  const canAccessAdmin = isMaster || payload.application === ADMIN_APPLICATION_SLUG;

  if (isDashboardPage && !canAccessAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isUnauthorizedPage && canAccessAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
