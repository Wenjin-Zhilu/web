import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSafeLocalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

function getPublicOrigin(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const publicOrigin = getPublicOrigin(request);

  if (host === "wenjin-zhilu.com") {
    const url = request.nextUrl.clone();
    url.hostname = "www.wenjin-zhilu.com";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Mentor subdomain — rewrite root to /mentor landing
  if (host === "mentor.wenjin-zhilu.com") {
    if (pathname === "/" || pathname === "/mentor") {
      const url = request.nextUrl.clone();
      url.pathname = "/mentor";
      return NextResponse.rewrite(url);
    }
    // /auth on mentor subdomain: inject role=mentor so the page renders mentor UI
    if (
      pathname.startsWith("/auth") &&
      request.nextUrl.searchParams.get("role") !== "mentor"
    ) {
      const url = request.nextUrl.clone();
      url.searchParams.set("role", "mentor");
      return NextResponse.rewrite(url);
    }
    // Other paths (/dashboard, /onboarding, /admin, /call, /api/*) pass through
  } else if (
    pathname === "/mentor" &&
    (host === "www.wenjin-zhilu.com" || host === "wenjin-zhilu.com")
  ) {
    // On main domain, redirect /mentor to mentor subdomain
    const url = request.nextUrl.clone();
    url.hostname = "mentor.wenjin-zhilu.com";
    url.port = "";
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }

  // Admin subdomain — rewrite root to /admin
  if (host === "admin.wenjin-zhilu.com") {
    if (pathname === "/" || pathname === "/admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    // Other paths pass through (mainly /api/* which is excluded by matcher)
  } else if (
    pathname === "/admin" &&
    (host === "www.wenjin-zhilu.com" || host === "wenjin-zhilu.com")
  ) {
    // On main domain, redirect /admin to admin subdomain
    const url = request.nextUrl.clone();
    url.hostname = "admin.wenjin-zhilu.com";
    url.port = "";
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }

  // Check session by calling the backend
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/call");
  const isAuthPage = pathname.startsWith("/auth");

  if (isProtected || isAuthPage) {
    let isLoggedIn = false;
    const roleParam = request.nextUrl.searchParams.get("role");
    const isMentorContext = host === "mentor.wenjin-zhilu.com" || roleParam === "mentor";

    let sessionEndpoints: string[];
    if (isAuthPage) {
      sessionEndpoints = [isMentorContext ? "/api/mauth/get-session" : "/api/auth/get-session"];
    } else {
      sessionEndpoints = ["/api/auth/get-session", "/api/mauth/get-session"];
    }

    for (const endpoint of sessionEndpoints) {
      try {
        const sessionRes = await fetch(new URL(endpoint, publicOrigin), {
          headers: { cookie: request.headers.get("cookie") || "" },
          cache: "no-store",
        });
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          if (data?.user) { isLoggedIn = true; break; }
        }
      } catch {}
    }

    // Protected routes: redirect to /auth if not logged in
    if (isProtected && !isLoggedIn) {
      const url = new URL("/auth", publicOrigin);
      url.searchParams.set("mode", "login");
      url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }

    // Auth pages: redirect to the intended local destination if already logged in
    if (isAuthPage && isLoggedIn) {
      const redirectTo = getSafeLocalRedirect(request.nextUrl.searchParams.get("redirect")) || "/dashboard";
      const url = new URL(redirectTo, publicOrigin);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
