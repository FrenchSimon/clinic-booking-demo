import { en } from "./en";
import { fr } from "./fr";
import type { Locale } from "./locale";

// English is the source: fr is typed against it, so a missing or extra key
// in French fails the typecheck.
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, fr };
