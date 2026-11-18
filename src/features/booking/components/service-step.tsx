import Link from "next/link";
import { formatEuros } from "@/features/services/schema";
import { cn } from "@/lib/utils";
import type { PublicService } from "../public";
import { type Selection, selectionHref } from "../selection";
import { Step } from "./step";

export function ServiceStep({
  slug,
  services,
  selection,
}: {
  slug: string;
  services: PublicService[];
  selection: Selection;
}) {
  return (
    <Step number={1} title="Session">
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
                    {s.durationMinutes} min
                  </span>
                </span>
                <strong>{formatEuros(s.priceCents)}</strong>
              </Link>
            </li>
          );
        })}
      </ul>
    </Step>
  );
}
