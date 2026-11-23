// The shape of the legal texts, the same in every language: sections of
// paragraphs and lists, where a piece of text can be a link or bold.

/** Where a link in the legal text goes. */
export type LegalTarget = "terms" | "privacy" | "code";

export type LegalInline =
  | string
  | { link: LegalTarget; text: string }
  | { strong: string };

/** A paragraph, or a bulleted list of items. */
export type LegalBlock = { p: LegalInline[] } | { ul: LegalInline[][] };

export type LegalSection = { title: string; blocks: LegalBlock[] };
