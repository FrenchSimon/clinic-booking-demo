// The two languages of the interface. English is the default: Fiverr and
// Upwork link to the demo without a language, and get it in English. No
// "server-only": the proxy and client components read these too.

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** The cookie that keeps the visitor's choice, and the query that sets it. */
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The tag Intl formats dates, times and prices with: a Brussels clinic. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  fr: "fr-BE",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

/** A cookie or query value as a locale, or the default for anything else. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Fills "{name}" placeholders: fill("Hello {name}", { name: "Léa" }). */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
