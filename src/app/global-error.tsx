"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";
import { status as en } from "@/i18n/en/status";
import { status as fr } from "@/i18n/fr/status";

/** Outside the [lang] layout: the language comes from the `lang` cookie. */
function strings() {
  if (typeof document === "undefined") return en.globalError;
  return /(?:^|;\s*)lang=fr(?:;|$)/.test(document.cookie)
    ? fr.globalError
    : en.globalError;
}

// Last resort, when the root layout itself fails: it replaces the whole
// document, so it brings its own <html> and styles. The fonts fall back to
// Georgia and the system font (globals.css), which is fine for a rare page.
export default function GlobalError({ retry }: { retry: () => void }) {
  const s = strings();
  return (
    <html
      lang={s === fr.globalError ? "fr" : "en"}
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <title>{s.title}</title>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 sm:px-8 sm:py-20">
          <p className="font-heading font-semibold text-2xl text-primary">
            Kinora
          </p>
          <h1 className="font-heading font-normal text-4xl sm:text-5xl">
            {s.heading}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {s.text}
          </p>
          <div>
            <Button size="lg" onClick={() => retry()}>
              {s.retry}
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
