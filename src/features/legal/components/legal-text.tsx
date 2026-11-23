import Link from "next/link";
import type {
  LegalInline,
  LegalTarget,
  LegalSection as Section,
} from "@/i18n/en/legal-types";
import { LegalSection } from "./legal-page";

const SOURCE_CODE = "https://github.com/FrenchSimon/clinic-booking-demo";

const PAGES: Record<Exclude<LegalTarget, "code">, string> = {
  terms: "/terms",
  privacy: "/privacy",
};

function Inline({ part, newTab }: { part: LegalInline; newTab: string }) {
  if (typeof part === "string") return part;
  if ("strong" in part) return <strong>{part.strong}</strong>;
  if (part.link === "code") {
    return (
      <a href={SOURCE_CODE} target="_blank" rel="noopener noreferrer">
        {part.text}
        <span className="sr-only">{newTab}</span>
      </a>
    );
  }
  return <Link href={PAGES[part.link]}>{part.text}</Link>;
}

function Parts({ parts, newTab }: { parts: LegalInline[]; newTab: string }) {
  return parts.map((part, i) => (
    // The parts of one sentence never move: their index is a stable key.
    // biome-ignore lint/suspicious/noArrayIndexKey: static text
    <Inline key={i} part={part} newTab={newTab} />
  ));
}

/** The terms or the privacy notice, from the dictionary of the page's language. */
export function LegalText({
  sections,
  newTab,
}: {
  sections: Section[];
  newTab: string;
}) {
  return sections.map((section) => (
    <LegalSection key={section.title} title={section.title}>
      {section.blocks.map((block, i) =>
        "p" in block ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: static text
          <p key={i}>
            <Parts parts={block.p} newTab={newTab} />
          </p>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: static text
          <ul key={i}>
            {block.ul.map((item, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static text
              <li key={j}>
                <Parts parts={item} newTab={newTab} />
              </li>
            ))}
          </ul>
        ),
      )}
    </LegalSection>
  ));
}
