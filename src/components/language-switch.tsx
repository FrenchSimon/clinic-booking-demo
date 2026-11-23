"use client";

import type { MouseEvent } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locale";

// French first, as it reads in the bar: "FR | EN".
const ORDER: Locale[] = ["fr", "en"];

/**
 * "FR | EN" on the right of the portfolio bar. Each link reloads the current
 * address with ?lang=, which the proxy keeps in the cookie before serving the
 * clean address again. Without JavaScript the link still works, it only
 * drops the rest of the query.
 */
export function LanguageSwitch({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  function keepQuery(e: MouseEvent<HTMLAnchorElement>, locale: Locale) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set(LOCALE_COOKIE, locale);
    window.location.assign(url);
  }

  return (
    <nav aria-label={label} className="-mr-2 flex items-center">
      {ORDER.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className="h-4 w-px bg-demo-muted/60" />
          )}
          <a
            href={`?${LOCALE_COOKIE}=${locale}`}
            hrefLang={locale}
            lang={locale}
            aria-current={locale === current ? "true" : undefined}
            onClick={(e) => keepQuery(e, locale)}
            className={
              locale === current
                ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 font-bold text-demo-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-demo-foreground"
                : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 font-normal text-demo-foreground focus-visible:outline-2 focus-visible:outline-demo-foreground"
            }
          >
            {locale.toUpperCase()}
          </a>
        </span>
      ))}
    </nav>
  );
}
