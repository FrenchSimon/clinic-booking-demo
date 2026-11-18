"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";

// Last resort, when the root layout itself fails: it replaces the whole
// document, so it brings its own <html> and styles. The fonts fall back to
// Georgia and the system font (globals.css), which is fine for a rare page.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>Something went wrong · Kinora</title>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 sm:px-8 sm:py-20">
          <p className="font-heading font-semibold text-2xl text-primary">
            Kinora
          </p>
          <h1 className="font-heading font-normal text-4xl sm:text-5xl">
            Kinora could not load
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The problem is on our side. Your bookings and payments are safe: try
            again in a moment.
          </p>
          <div>
            <Button size="lg" onClick={() => retry()}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
