import { formatSessionTime } from "@/features/booking/email";

/**
 * Tells a demo visitor the clinic is theirs alone and when it goes away
 * (checklist #19). The clean-up job deletes it with their anonymous account,
 * 24 hours after the account was created (cleanup.ts).
 */
export function DemoNotice({ startedAt }: { startedAt: string }) {
  const deletedAt = new Date(new Date(startedAt).getTime() + 24 * 3_600_000);
  return (
    <p className="rounded-[18px] border border-dashed p-5 text-muted-foreground text-sm sm:p-8">
      This demo clinic is yours alone: the team, patients and bookings are made
      up, and payments use Stripe's test mode. It is deleted after 24 hours,
      from {formatSessionTime(deletedAt)}.
    </p>
  );
}
