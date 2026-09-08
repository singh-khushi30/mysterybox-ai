import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ISSUED_COOKIE, issuedCookieIsExpired } from "@/lib/auth/lifetime";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

function isProtectedPath(pathname: string) {
  return pathname === "/profile" || pathname.startsWith("/profile/") || pathname.includes("/investigate");
}

function expireSession(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/cases");
  url.searchParams.set("reason", "timeout");
  const response = NextResponse.redirect(url);
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name === ISSUED_COOKIE || (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))) {
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const issued = request.cookies.get(ISSUED_COOKIE)?.value;
  if (user && issued && issuedCookieIsExpired(issued) && pathname !== "/login" && pathname !== "/signup") {
    return expireSession(request, `${pathname}${search}`);
  }
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/cases";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
