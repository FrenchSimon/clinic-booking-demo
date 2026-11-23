import type { ReactNode } from "react";
import { dateFormat } from "@/i18n/format";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import type { ClinicPatient } from "../queries";

const COLUMNS = "sm:grid sm:grid-cols-[1fr_90px_120px_150px] sm:gap-4";

/**
 * The clinic's patients. On a phone each one is a stacked row, from `sm:`
 * a table with a header row Patient · Sessions · Last · Next.
 */
export async function PatientList({ patients }: { patients: ClinicPatient[] }) {
  const { locale, t } = await getDictionary();
  const p = t.clinic.patients;
  const day = dateFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dayAndTime = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  if (patients.length === 0) {
    return (
      <p className="rounded-[18px] border bg-card p-5 text-muted-foreground sm:p-8">
        {p.empty}
      </p>
    );
  }
  return (
    <section
      aria-label={p.title}
      className="flex flex-col overflow-hidden rounded-[14px] border bg-card"
    >
      <div
        aria-hidden="true"
        className={`hidden border-divider border-b bg-muted px-5 py-2.5 font-semibold text-[13px] text-muted-foreground uppercase tracking-[0.06em] ${COLUMNS}`}
      >
        <span>{p.columns.patient}</span>
        <span>{p.columns.sessions}</span>
        <span>{p.columns.last}</span>
        <span>{p.columns.next}</span>
      </div>
      <ul>
        {patients.map((patient) => (
          <li
            key={patient.id}
            className={`flex flex-col gap-1 border-divider border-b px-4 py-3.5 last:border-b-0 sm:items-center sm:px-5 ${COLUMNS}`}
          >
            <span className="flex min-w-0 flex-col">
              <a
                href={`mailto:${patient.email}`}
                className="flex min-h-11 items-center break-all font-semibold underline-offset-4 hover:underline sm:min-h-0"
              >
                {patient.email}
              </a>
              <span className="text-muted-foreground text-sm">
                {fill(p.since, { date: day.format(patient.since) })}
              </span>
            </span>
            <Cell label={p.columns.sessions} separator={t.clinic.common.colon}>
              {patient.pastSessions}
            </Cell>
            <Cell label={p.columns.last} separator={t.clinic.common.colon}>
              {patient.lastSession ? day.format(patient.lastSession) : p.none}
            </Cell>
            <Cell label={p.columns.next} separator={t.clinic.common.colon}>
              {patient.nextSession
                ? dayAndTime.format(patient.nextSession)
                : p.noneBooked}
            </Cell>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A value with its label on a phone, where the table header is hidden. */
function Cell({
  label,
  separator,
  children,
}: {
  label: string;
  /** ": " in English, a non-breaking space first in French. */
  separator: string;
  children: ReactNode;
}) {
  return (
    <span className="text-muted-foreground text-sm sm:text-base">
      <span className="sm:hidden">
        {label}
        {separator}
      </span>
      {children}
    </span>
  );
}
