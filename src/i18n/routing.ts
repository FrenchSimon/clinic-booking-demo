import { isLocale, LOCALE_COOKIE, type Locale, toLocale } from "./locale";

// Addresses stay the same in both languages (/clinic, not /fr/clinic): the
// proxy serves each page from the [lang] root segment of the visitor's
// language, so links, emails and Stripe return URLs need no language.

/** Route handlers live outside [lang]: they have no page to translate. */
const OUTSIDE = ["/api", "/auth", "/start", "/_next", "/__nextjs"];

export type LocaleRoute =
  | { kind: "pass" }
  /** `?lang=` on the address: keep the choice, then load the clean address. */
  | { kind: "redirect"; to: URL; locale: Locale | null }
  /** Serve /<locale><path> under the visitor's address. */
  | { kind: "rewrite"; to: URL; locale: Locale };

export function localeRoute(url: URL, cookie: string | undefined): LocaleRoute {
  const { pathname, searchParams } = url;
  if (OUTSIDE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return { kind: "pass" };
  }
  if (searchParams.has(LOCALE_COOKIE)) {
    const asked = searchParams.get(LOCALE_COOKIE);
    const to = new URL(url);
    to.searchParams.delete(LOCALE_COOKIE);
    return { kind: "redirect", to, locale: isLocale(asked) ? asked : null };
  }
  const locale = toLocale(cookie);
  const to = new URL(url);
  to.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return { kind: "rewrite", to, locale };
}
