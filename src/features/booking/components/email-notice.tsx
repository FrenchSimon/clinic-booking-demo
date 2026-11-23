import { Mail } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";

/**
 * Which email the patient was just sent, shown once after paying or
 * cancelling. In a demo clinic (`to` null) it waits in the Outbox instead.
 */
export type EmailNotice = { kind: "booked" | "cancelled"; to: string | null };

/**
 * The email notice (checklist #14, #21) as a callout under the title, so
 * the patient sees it at once. Part of the page, not a modal: it hides
 * nothing and needs no closing. "On its way", not "sent": the email goes
 * out after this page, and may fail.
 */
export async function EmailCallout({ notice }: { notice: EmailNotice }) {
  const { t } = await getDictionary();
  const e = t.booking.mine.email;
  const what = e[notice.kind];
  return (
    <div className="flex w-full gap-3 rounded-[14px] bg-status-confirmed p-4 text-status-confirmed-foreground">
      <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      {notice.to === null ? (
        <div className="flex min-w-0 flex-col items-start gap-3">
          <p>
            <strong>{fill(e.inOutbox, { what })}</strong> {e.noRealEmail}
          </p>
          <Link
            href="/outbox"
            className={buttonVariants({ variant: "outline" })}
          >
            {e.openOutbox}
          </Link>
        </div>
      ) : (
        <p className="min-w-0">
          <strong>{fill(e.onItsWay, { what })}</strong> {e.to}{" "}
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
