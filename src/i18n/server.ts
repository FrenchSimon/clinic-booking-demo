import "server-only";
import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { type Dictionary, dictionaries } from "./dictionaries";
import { LOCALE_COOKIE, type Locale, toLocale } from "./locale";

/**
 * The page's language, in any Server Component: the proxy serves every page
 * under /en or /fr (the [lang] root segment) from the `lang` cookie, so the
 * page can still be prerendered once per language.
 */
export async function getLocale(): Promise<Locale> {
  return toLocale(await lang());
}

/** The page's language and its strings. */
export async function getDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

/**
 * The visitor's language in a Server Action or a route handler, where the
 * root segment cannot be read: the same cookie the proxy reads.
 */
export async function getRequestLocale(): Promise<Locale> {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

/** The strings of the visitor's language in a Server Action. */
export async function getRequestDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, t: dictionaries[locale] };
}
