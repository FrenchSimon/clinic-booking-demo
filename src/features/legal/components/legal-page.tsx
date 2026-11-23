import Link from "next/link";
import type { ReactNode } from "react";

/** Frame of /terms and /privacy: the Kinora logo, a title, then readable text. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** "Last updated on …": when the terms or the privacy notice changed. */
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-8 sm:py-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-heading font-semibold text-2xl text-primary"
          >
            Kinora
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-normal text-4xl">{title}</h1>
          <p className="text-muted-foreground text-sm">{updated}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

/** A titled block of legal text, with paragraphs and lists spaced for reading. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
      <h2 className="font-heading font-semibold text-2xl">{title}</h2>
      {children}
    </section>
  );
}
