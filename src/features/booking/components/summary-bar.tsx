import type { ReactNode } from "react";
import { formatEuros } from "@/features/services/schema";
import { bookAndPay } from "../actions";
import type { Selection } from "../selection";
import { PayButton } from "./pay-button";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Fixed at the bottom: what the patient picked, its price, and the next step. */
export function SummaryBar({
  slug,
  selection,
  physioName,
  error,
  floating,
}: {
  slug: string;
  selection: Selection;
  physioName: string;
  /** Why the last attempt failed, shown above the button. */
  error?: string;
  /** Floats just above the bar, on the right: the assistant's button. */
  floating?: ReactNode;
}) {
  const { service, day, at } = selection;
  if (!service) return null;
  const when =
    day && at
      ? `${dayFormat.format(new Date(`${day}T12:00:00Z`))} · ${at} · ${physioName}`
      : "Pick a day and a time";

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-card">
      {floating && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full">
          <div className="mx-auto flex w-full max-w-xl justify-end px-4 pb-4">
            <div className="pointer-events-auto">{floating}</div>
          </div>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-4 py-4">
        <p className="flex justify-between gap-4">
          <span>{when}</span>
          <strong>{formatEuros(service.priceCents)}</strong>
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <form action={bookAndPay}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="service" value={service.id} />
          <input type="hidden" name="physio" value={selection.physio} />
          <input type="hidden" name="day" value={day ?? ""} />
          <input type="hidden" name="at" value={at ?? ""} />
          <PayButton disabled={!day || !at} />
        </form>
        <p className="text-center text-muted-foreground text-xs">
          Test mode, no real payment: pay with card{" "}
          <span className="whitespace-nowrap font-semibold text-foreground">
            4242 4242 4242 4242
          </span>
          , any future date and any CVC.
        </p>
        <p className="text-center text-muted-foreground text-xs">
          Your slot is held for 15 minutes while you pay · Booking by Kinora
        </p>
      </div>
    </div>
  );
}
