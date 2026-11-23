import { StatusPill } from "@/features/booking/components/status-pill";
import { timeFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { TodaySession } from "../queries";

const COLUMNS = "sm:grid sm:grid-cols-[64px_1.3fr_1fr_0.8fr_150px] sm:gap-4";

/**
 * Today's sessions in the clinic. On a phone each one is a stacked row,
 * from `sm:` a table with a header row Time · Patient · Session · Physio · Status.
 */
export async function TodaySessions({
  sessions,
}: {
  sessions: TodaySession[];
}) {
  const { locale, t } = await getDictionary();
  const d = t.clinic.dashboard;
  const { staffBooking, physio } = t.clinic.common;
  const time = timeFormat(locale);
  return (
    <section
      aria-labelledby="today-sessions-title"
      className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
    >
      <h2
        id="today-sessions-title"
        className="border-divider border-b px-4 py-4 font-semibold text-[17px] sm:px-5"
      >
        {d.sessionsTitle}
      </h2>
      {sessions.length === 0 ? (
        <p className="px-4 py-5 text-muted-foreground sm:px-5">{d.noSession}</p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={`hidden border-divider border-b bg-muted px-5 py-2.5 font-semibold text-[13px] text-muted-foreground uppercase tracking-[0.06em] ${COLUMNS}`}
          >
            <span>{d.columns.time}</span>
            <span>{d.columns.patient}</span>
            <span>{d.columns.session}</span>
            <span>{d.columns.physio}</span>
            <span>{d.columns.status}</span>
          </div>
          <ul>
            {sessions.map((s) => (
              <li
                key={s.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-divider border-b px-4 py-3.5 last:border-b-0 sm:px-5 ${COLUMNS}`}
              >
                <strong>{time.format(s.startsAt)}</strong>
                <span
                  title={s.patientEmail ?? undefined}
                  className="order-last w-full min-w-0 break-all sm:order-none sm:w-auto sm:truncate"
                >
                  {s.patientEmail ?? staffBooking}
                </span>
                <span className="order-last w-full text-muted-foreground text-sm sm:order-none sm:w-auto sm:text-base">
                  {s.serviceName}
                  <span className="sm:hidden"> · {s.physioName ?? physio}</span>
                </span>
                <span className="hidden text-muted-foreground sm:inline">
                  {s.physioName ?? physio}
                </span>
                <span className="ml-auto sm:ml-0 sm:justify-self-start">
                  <StatusPill status={s.status} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
