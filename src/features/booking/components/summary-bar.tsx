import type { ReactNode } from "react";
import { formatEuros } from "@/features/services/schema";
import { INTL_LOCALE } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { bookAndPay } from "../actions";
import type { Selection } from "../selection";
import { PayButton } from "./pay-button";

/** Fixed at the bottom: what the patient picked, its price, and the next step. */
export async function SummaryBar({
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
  const { locale, t } = await getDictionary();
  // A calendar day: formatted in UTC so it never shifts.
  const dayFormat = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const when =
    day && at
      ? `${dayFormat.format(new Date(`${day}T12:00:00Z`))} · ${at} · ${physioName}`
      : t.booking.pickTime;

  return (
    <div className="sticky bottom-0 border-t bg-card">
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
          <strong className="whitespace-nowrap">
            {formatEuros(service.priceCents, locale)}
          </strong>
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
          <PayButton
            disabled={!day || !at}
            label={t.booking.pay}
            pendingLabel={t.booking.holding}
          />
        </form>
        <p className="text-center text-muted-foreground text-xs">
          {t.booking.testCard}{" "}
          <span className="whitespace-nowrap font-semibold text-foreground">
            4242 4242 4242 4242
          </span>
          {t.booking.testCardEnd}
        </p>
        <p className="text-center text-muted-foreground text-xs">
          {t.booking.held}
        </p>
      </div>
    </div>
  );
}
