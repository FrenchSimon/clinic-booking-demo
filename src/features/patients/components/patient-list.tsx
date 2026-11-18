import type { ReactNode } from "react";
import type { ClinicPatient } from "../queries";

const day = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Brussels",
});
const dayAndTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

const COLUMNS = "sm:grid sm:grid-cols-[1fr_90px_120px_150px] sm:gap-4";

/**
 * The clinic's patients. On a phone each one is a stacked row, from `sm:`
 * a table with a header row Patient · Sessions · Last · Next.
 */
export function PatientList({ patients }: { patients: ClinicPatient[] }) {
  if (patients.length === 0) {
    return (
      <p className="rounded-[18px] border bg-card p-5 text-muted-foreground sm:p-8">
        No patient yet. Patients appear here once they book a session on your
        booking page.
      </p>
    );
  }
  return (
    <section
      aria-label="Patients"
      className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
    >
      <div
        aria-hidden="true"
        className={`hidden border-divider border-b bg-muted px-5 py-2.5 font-semibold text-[13px] text-muted-foreground uppercase tracking-[0.06em] ${COLUMNS}`}
      >
        <span>Patient</span>
        <span>Sessions</span>
        <span>Last</span>
        <span>Next</span>
      </div>
      <ul>
        {patients.map((p) => (
          <li
            key={p.id}
            className={`flex flex-col gap-1 border-divider border-b px-4 py-3.5 last:border-b-0 sm:items-center sm:px-5 ${COLUMNS}`}
          >
            <span className="flex min-w-0 flex-col">
              <a
                href={`mailto:${p.email}`}
                className="flex min-h-11 items-center break-all font-semibold underline-offset-4 hover:underline sm:min-h-0"
              >
                {p.email}
              </a>
              <span className="text-muted-foreground text-sm">
                Patient since {day.format(p.since)}
              </span>
            </span>
            <Cell label="Sessions">{p.pastSessions}</Cell>
            <Cell label="Last">
              {p.lastSession ? day.format(p.lastSession) : "None"}
            </Cell>
            <Cell label="Next">
              {p.nextSession ? dayAndTime.format(p.nextSession) : "None booked"}
            </Cell>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A value with its label on a phone, where the table header is hidden. */
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="text-muted-foreground text-sm sm:text-base">
      <span className="sm:hidden">{label}: </span>
      {children}
    </span>
  );
}
