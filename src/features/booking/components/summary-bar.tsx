import { Button } from "@/components/ui/button";
import { formatEuros } from "@/features/services/schema";
import type { Selection } from "../selection";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Fixed at the bottom: what the patient picked, its price, and the next step. */
export function SummaryBar({
  selection,
  physioName,
}: {
  selection: Selection;
  physioName: string;
}) {
  const { service, day, at } = selection;
  if (!service) return null;
  const when =
    day && at
      ? `${dayFormat.format(new Date(`${day}T12:00:00Z`))} · ${at} · ${physioName}`
      : "Pick a day and a time";

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-card">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-4 py-4">
        <p className="flex justify-between gap-4">
          <span>{when}</span>
          <strong>{formatEuros(service.priceCents)}</strong>
        </p>
        {/* Payment arrives with the 15-minute hold and Stripe Checkout (R2.6). */}
        <Button size="lg" disabled className="w-full">
          Continue to payment
        </Button>
        <p className="text-center text-muted-foreground text-xs">
          Online payment opens soon · Booking by Kinora
        </p>
      </div>
    </div>
  );
}
