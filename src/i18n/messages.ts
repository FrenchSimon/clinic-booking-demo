import type { Dictionary } from "./dictionaries";
import { dictionaries } from "./dictionaries";
import type { Locale } from "./locale";

type Messages = Record<string, string>;

/**
 * A validation message in the visitor's language. The Zod schemas keep their
 * English messages (one schema for the form and the Server Action, tested in
 * English); an action passes each message through here before showing it.
 * The English text is looked up in `pick(en)` and the same key returned from
 * the other language; a message that is not listed comes back unchanged.
 */
export function translateMessage(
  message: string,
  locale: Locale,
  pick: (d: Dictionary) => Messages,
): string {
  if (locale === "en") return message;
  const source = pick(dictionaries.en);
  const key = Object.keys(source).find((k) => source[k] === message);
  return (key && pick(dictionaries[locale])[key]) || message;
}
