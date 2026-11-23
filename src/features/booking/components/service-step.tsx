import Link from "next/link";
import { formatEuros } from "@/features/services/schema";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";
import type { PublicService } from "../public";
import { type Selection, selectionHref } from "../selection";
import { Step } from "./step";

export async function ServiceStep({
  slug,
  services,
  selection,
}: {
  slug: string;
  services: PublicService[];
  selection: Selection;
}) {
  const { locale, t } = await getDictionary();
  return (
    <Step number={1} title={t.booking.steps.session}>
      <ul className="flex flex-col gap-2">
        {services.map((s) => {
          const current = s.id === selection.service?.id;
          return (
            <li key={s.id}>
              <Link
                href={selectionHref(slug, selection, { service: s.id })}
                scroll={false}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-4 rounded-[14px] border bg-card px-4 py-2",
                  current && "border-2 border-primary",
                )}
              >
                <span>
                  <strong className="block">{s.name}</strong>
                  <span className="text-muted-foreground text-sm">
                    {fill(t.booking.minutes, { minutes: s.durationMinutes })}
                  </span>
                </span>
                <strong>{formatEuros(s.priceCents, locale)}</strong>
              </Link>
            </li>
          );
        })}
      </ul>
    </Step>
  );
}
