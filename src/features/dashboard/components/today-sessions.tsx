import { StatusPill } from "@/features/booking/components/status-pill";
import type { ClinicBooking } from "../queries";

const time = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

const COLUMNS = "sm:grid sm:grid-cols-[72px_1fr_1fr_150px] sm:gap-4";

/**
 * Today's sessions in the clinic. On a phone each one is a stacked row,
 * from `sm:` a table with a header row Time · Session · Physio · Status.
 */
export function TodaySessions({ sessions }: { sessions: ClinicBooking[] }) {
  return (
    <section
      aria-labelledby="today-sessions-title"
      className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
    >
      <h2
        id="today-sessions-title"
        className="border-divider border-b px-4 py-4 font-semibold text-[17px] sm:px-5"
      >
        Today's sessions
      </h2>
      {sessions.length === 0 ? (
        <p className="px-4 py-5 text-muted-foreground sm:px-5">
          No session booked today.
        </p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={`hidden border-divider border-b bg-muted px-5 py-2.5 font-semibold text-[13px] text-muted-foreground uppercase tracking-[0.06em] ${COLUMNS}`}
          >
            <span>Time</span>
            <span>Session</span>
            <span>Physio</span>
            <span>Status</span>
          </div>
          <ul>
            {sessions.map((s) => (
              <li
                key={s.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-divider border-b px-4 py-3.5 last:border-b-0 sm:px-5 ${COLUMNS}`}
              >
                <strong>{time.format(s.startsAt)}</strong>
                <span className="order-last w-full text-muted-foreground text-sm sm:order-none sm:w-auto sm:text-base">
                  {s.serviceName}
                  <span className="sm:hidden">
                    {" "}
                    · {s.physioName ?? "Physio"}
                  </span>
                </span>
                <span className="hidden text-muted-foreground sm:inline">
                  {s.physioName ?? "Physio"}
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
