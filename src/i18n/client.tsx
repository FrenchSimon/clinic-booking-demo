"use client";

import { createContext, type ReactNode, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locale";

// For the few client components that cannot get their strings as props from
// a Server Component (the error page). Everything else receives its strings.
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
