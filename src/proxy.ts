import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/i18n/locale";
import { localeRoute } from "@/i18n/routing";
import { env } from "@/lib/env";

// Pages that need a signed-in user. Actions and pages still call requireUser():
// this redirect is a convenience, not the access control.
const PROTECTED = ["/start", "/clinic", "/bookings", "/reset-password"];

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function proxy(request: NextRequest) {
  // Kept until the end: the response depends on the language route below.
  const sessionCookies: CookieToSet[] = [];
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet)
            request.cookies.set(name, value);
          sessionCookies.push(...cookiesToSet);
          Object.assign(cacheHeaders, headers);
        },
      },
    },
  );

  // Refreshes the session cookie when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const route = localeRoute(
    request.nextUrl,
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  let response: NextResponse;
  if (route.kind === "redirect") {
    response = NextResponse.redirect(route.to);
    if (route.locale) {
      response.cookies.set(LOCALE_COOKIE, route.locale, {
        path: "/",
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    }
  } else if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    response = NextResponse.redirect(url);
  } else if (route.kind === "rewrite") {
    response = NextResponse.rewrite(route.to, { request });
  } else {
    response = NextResponse.next({ request });
  }

  for (const { name, value, options } of sessionCookies) {
    response.cookies.set(name, value, options);
  }
  for (const [key, value] of Object.entries(cacheHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
