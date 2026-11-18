import { Mail } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Which email the patient was just sent, shown once after paying or
 * cancelling. In a demo clinic (`to` null) it waits in the Outbox instead.
 */
export type EmailNotice = { kind: "booked" | "cancelled"; to: string | null };

const WHAT: Record<EmailNotice["kind"], string> = {
  booked: "Your confirmation email",
  cancelled: "Your cancellation and refund email",
};

/**
 * The email notice (checklist #14, #21) as a callout under the title, so
 * the patient sees it at once. Part of the page, not a modal: it hides
 * nothing and needs no closing. "On its way", not "sent": the email goes
 * out after this page, and may fail.
 */
export function EmailCallout({ notice }: { notice: EmailNotice }) {
  return (
    <div className="flex w-full gap-3 rounded-[14px] bg-status-confirmed p-4 text-status-confirmed-foreground">
      <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      {notice.to === null ? (
        <div className="flex min-w-0 flex-col items-start gap-3">
          <p>
            <strong>{WHAT[notice.kind]} is in the Outbox.</strong> No real email
            leaves a demo clinic.
          </p>
          <Link
            href="/outbox"
            className={buttonVariants({ variant: "outline" })}
          >
            Open the Outbox
          </Link>
        </div>
      ) : (
        <p className="min-w-0">
          <strong>{WHAT[notice.kind]} is on its way</strong> to{" "}
          {/* The address moves to the next line whole, not cut at a dash. */}
          <span className="inline-block max-w-full break-all font-semibold">
            {notice.to}
          </span>
          .
        </p>
      )}
    </div>
  );
}
