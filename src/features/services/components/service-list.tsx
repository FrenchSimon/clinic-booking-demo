import Link from "next/link";
import type { ServiceRow } from "../queries";
import { formatEuros } from "../schema";

/** The clinic's services, each one a link to its edit page. */
export function ServiceList({ services }: { services: ServiceRow[] }) {
  if (services.length === 0) {
    return (
      <p className="rounded-[18px] border bg-card p-5 text-muted-foreground sm:p-8">
        No service yet. Add the sessions patients can book, with their length
        and price.
      </p>
    );
  }
  return (
    <ul className="flex flex-col overflow-hidden rounded-[14px] border bg-card">
      {services.map((s) => (
        <li key={s.id} className="border-divider border-b last:border-b-0">
          <Link
            href={`/clinic/services/${s.id}`}
            className="flex min-h-11 flex-col gap-1 px-5 py-4 hover:bg-muted focus-visible:bg-muted"
          >
            <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="font-semibold">{s.name}</span>
              <span>
                {s.durationMinutes} min · {formatEuros(s.priceCents)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
              {!s.active && (
                <span className="rounded-full bg-status-closed px-3 py-1 font-semibold text-status-closed-foreground text-xs">
                  Hidden
                </span>
              )}
              {s.physios.length > 0
                ? s.physios.join(", ")
                : "No physio yet: patients cannot book it"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
