import { INTL_LOCALE, type Locale } from "./locale";

// Everything runs in Europe/Brussels (checklist: one time zone): every date
// and time on screen and in emails goes through these, in the reader's language.

const ZONE = "Europe/Brussels";

/** A date formatter in Brussels time: "Tue 24 Nov" or "mar. 24 nov.". */
export function dateFormat(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: ZONE,
    ...options,
  });
}

/** 24-hour time in Brussels: "09:30" in both languages. */
export function timeFormat(locale: Locale): Intl.DateTimeFormat {
  return dateFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** Euros: "€6,240" or "6 240 €" rounded, "€45.00" or "45,00 €" exact. */
export function moneyFormat(
  locale: Locale,
  { rounded = false }: { rounded?: boolean } = {},
): Intl.NumberFormat {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: rounded ? 0 : 2,
    minimumFractionDigits: rounded ? 0 : 2,
  });
}
