import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * "I accept the terms and the privacy notice", required at sign-up. The links
 * open in a new tab so the email and password typed so far are not lost.
 */
export function TermsCheckbox({
  error,
  t,
}: {
  error?: string;
  t: Dictionary["auth"]["signup"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-11 items-start gap-3">
        <input
          id="field-terms"
          name="terms"
          type="checkbox"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "field-terms-error" : undefined}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <label htmlFor="field-terms" className="text-sm leading-snug">
          {t.termsBefore}
          <NewTabLink href="/terms" newTab={t.newTab}>
            {t.termsLink}
          </NewTabLink>
          {t.termsMiddle}
          <NewTabLink href="/privacy" newTab={t.newTab}>
            {t.privacyLink}
          </NewTabLink>
          {t.termsAfter}
        </label>
      </div>
      {error && (
        <p id="field-terms-error" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

function NewTabLink({
  href,
  newTab,
  children,
}: {
  href: string;
  newTab: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className="font-medium text-primary underline"
    >
      {children}
      <span className="sr-only">{newTab}</span>
    </Link>
  );
}
