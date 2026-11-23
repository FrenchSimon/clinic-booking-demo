import { StatusPill } from "@/features/booking/components/status-pill";
import { timeFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { AgendaSession } from "../queries";

/**
 * The sessions of one day: time, patient, session and status. On a phone
 * the patient and session wrap under the time, from `sm:` one line each.
 */
export async function SessionList({ sessions }: { sessions: AgendaSession[] }) {
  const { locale, t } = await getDictionary();
  const time = timeFormat(locale);
  return (
    <ul>
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-divider border-b px-4 py-3.5 last:border-b-0 sm:grid sm:grid-cols-[64px_1.3fr_1fr_150px] sm:gap-4 sm:px-5"
        >
          <strong>{time.format(s.startsAt)}</strong>
          <span
            title={s.patientEmail ?? undefined}
            className="order-last w-full min-w-0 break-all sm:order-none sm:w-auto sm:truncate"
          >
            {s.patientEmail ?? t.clinic.common.staffBooking}
          </span>
          <span className="order-last w-full text-muted-foreground text-sm sm:order-none sm:w-auto sm:text-base">
            {s.serviceName}
          </span>
          <span className="ml-auto sm:ml-0 sm:justify-self-start">
            <StatusPill status={s.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}
