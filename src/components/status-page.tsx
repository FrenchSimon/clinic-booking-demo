import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Frame of the 404 and error pages: the Kinora logo, a small oak label, a
 * heading, a sentence that says what to do, then the ways out as buttons.
 */
export function StatusPage({
  label,
  title,
  children,
  actions,
}: {
  label: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 sm:px-8 sm:py-20">
        <p className="font-semibold text-oak text-sm uppercase tracking-[0.08em]">
          {label}
        </p>
        <h1 className="font-heading font-normal text-4xl sm:text-5xl">
          {title}
        </h1>
        <div className="flex flex-col gap-3 text-lg text-muted-foreground leading-relaxed">
          {children}
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">{actions}</div>
      </main>
    </div>
  );
}
