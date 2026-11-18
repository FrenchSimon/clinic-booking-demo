"use client";

import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { Button, buttonVariants } from "@/components/ui/button";

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
  return (
    <StatusPage
      label="Something went wrong"
      title="This page could not load"
      actions={
        <>
          <Button size="lg" onClick={() => retry()}>
            Try again
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Go to the home page
          </Link>
        </>
      }
    >
      <p>
        The problem is on our side, not something you did. If you had just paid,
        open your bookings before paying again: every payment Stripe accepts is
        either confirmed or refunded.
      </p>
      {digest && <p className="text-sm">Reference: {digest}</p>}
    </StatusPage>
  );
}
