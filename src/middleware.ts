import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, ADMIN_COOKIE, isAdminAuthConfigured } from "@/lib/admin/sessionToken";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  if (!isAdminAuthConfigured()) {
    if (pathname.startsWith("/admin")) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("error", "not-configured");
      return NextResponse.redirect(login);
    }

    if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
      return NextResponse.json(
        { error: "Admin login is not configured. Set ADMIN_PASSWORD in .env" },
        { status: 503 }
      );
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const login = new URL("/admin/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
