import Link from "next/link";
import { getDictionary } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { type Selection, selectionHref } from "../selection";
import { Step } from "./step";

export async function PhysioStep({
  slug,
  physios,
  selection,
}: {
  slug: string;
  /** The physios who give the selected service. */
  physios: { id: string; name: string }[];
  selection: Selection;
}) {
  const { t } = await getDictionary();
  const choices = [{ id: "any", name: t.booking.any }, ...physios];
  return (
    <Step number={2} title={t.booking.steps.physio}>
      <ul className="flex flex-wrap gap-2">
        {choices.map((p) => {
          const current = p.id === selection.physio;
          return (
            <li key={p.id}>
              <Link
                href={selectionHref(slug, selection, { physio: p.id })}
                scroll={false}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-full px-4",
                  current
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "border border-chip",
                )}
              >
                {p.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </Step>
  );
}
