import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSafeLocalRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

// 仅判断 better-auth 会话 cookie 是否存在（不做网络/数据库校验）。
// cookie 名为 `<prefix>.session_token`，生产 HTTPS 下带 `__Secure-`/`__Host-` 前缀，
// 这里用后缀匹配把这几种情况全覆盖，避免漏判把已登录用户踢去登录。
function hasSessionCookie(request: NextRequest, prefix: string) {
  const suffix = `${prefix}.session_token`;
  return request.cookies
    .getAll()
    .some((c) => c.name === suffix || c.name.endsWith(`-${suffix}`));
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
    const roleParam = request.nextUrl.searchParams.get("role");
    const isMentorContext = host === "mentor.wenjin-zhilu.com" || roleParam === "mentor";

    // 受保护路由：只乐观判断会话 cookie 是否存在，不发网络请求。
    // 之前这里对 publicOrigin 发 /api/auth/get-session（经 Cloudflare 兜一圈，
    // 每次导航 ~0.6s）；Next.js 又会把列表/详情页里每个 <Link> 预取一遍，
    // 并发自检一旦超时/失败，就把已登录用户误判为未登录、踢回 /auth 重新登录。
    // 真正的会话校验仍在后端 requireAuth 和前端 DashboardLayout 里完成。
    if (isProtected) {
      const loggedIn =
        hasSessionCookie(request, "ba-parent") || hasSessionCookie(request, "ba-mentor");
      if (!loggedIn) {
        const url = new URL("/auth", publicOrigin);
        url.searchParams.set("mode", "login");
        url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(url);
      }
    }

    // 登录页：只有"确实已登录"才跳走，避免 cookie 过期时在 /auth ⇄ /dashboard 间死循环。
    // 这里需要真实校验，但失败也无害（顶多让用户停在 /auth 上）。
    if (isAuthPage) {
      const endpoint = isMentorContext ? "/api/mauth/get-session" : "/api/auth/get-session";
      let isLoggedIn = false;
      try {
        const sessionRes = await fetch(new URL(endpoint, publicOrigin), {
          headers: { cookie: request.headers.get("cookie") || "" },
          cache: "no-store",
        });
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          if (data?.user) isLoggedIn = true;
        }
      } catch {}
      if (isLoggedIn) {
        const redirectTo = getSafeLocalRedirect(request.nextUrl.searchParams.get("redirect")) || "/dashboard";
        return NextResponse.redirect(new URL(redirectTo, publicOrigin));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
