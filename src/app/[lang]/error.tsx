"use client";

import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/i18n/client";
import { status as en } from "@/i18n/en/status";
import { status as fr } from "@/i18n/fr/status";
import { fill } from "@/i18n/locale";

// Shown in place of a page that failed to render. The demo bar and the footer
// stay, so the visitor can try again or leave without reloading the site.
// In production the message is hidden; the digest matches the server log.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : null;
  const s = useLocale() === "fr" ? fr : en;
  return (
    <StatusPage
      label={s.error.label}
      title={s.error.title}
      actions={
        <>
          <Button size="lg" onClick={() => retry()}>
            {s.error.retry}
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {s.home}
          </Link>
        </>
      }
    >
      <p>{s.error.text}</p>
      {digest && (
        <p className="text-sm">{fill(s.error.reference, { digest })}</p>
      )}
    </StatusPage>
  );
}
