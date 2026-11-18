import Link from "next/link";

/**
 * "I accept the terms and the privacy notice", required at sign-up. The links
 * open in a new tab so the email and password typed so far are not lost.
 */
export function TermsCheckbox({ error }: { error?: string }) {
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
          I accept the <NewTabLink href="/terms">terms of use</NewTabLink> and
          the <NewTabLink href="/privacy">privacy notice</NewTabLink>.
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

function NewTabLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="font-medium text-primary underline"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </Link>
  );
}
