import Link from "next/link";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import type { ServiceRow } from "../queries";
import { formatEuros } from "../schema";

/** The clinic's services, each one a link to its edit page. */
export async function ServiceList({ services }: { services: ServiceRow[] }) {
  const { locale, t } = await getDictionary();
  const s = t.team.services;
  if (services.length === 0) {
    return (
      <p className="rounded-[18px] border bg-card p-5 text-muted-foreground sm:p-8">
        {s.empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col overflow-hidden rounded-[14px] border bg-card">
      {services.map((service) => (
        <li
          key={service.id}
          className="border-divider border-b last:border-b-0"
        >
          <Link
            href={`/clinic/services/${service.id}`}
            className="flex min-h-11 flex-col gap-1 px-5 py-4 hover:bg-muted focus-visible:bg-muted"
          >
            <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="font-semibold">{service.name}</span>
              <span>
                {fill(s.minutes, { minutes: service.durationMinutes })} ·{" "}
                {formatEuros(service.priceCents, locale)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
              {!service.active && (
                <span className="rounded-full bg-status-closed px-3 py-1 font-semibold text-status-closed-foreground text-xs">
                  {s.hidden}
                </span>
              )}
              {service.physios.length > 0
                ? service.physios.join(", ")
                : s.noPhysio}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
