import Link from "next/link";
import { cn } from "@/lib/utils";

export type ClinicTab = "today" | "services";

const TABS: {
  id: ClinicTab;
  label: string;
  href: string;
  ownerOnly: boolean;
}[] = [
  { id: "today", label: "Today", href: "/clinic", ownerOnly: false },
  {
    id: "services",
    label: "Services",
    href: "/clinic/services",
    ownerOnly: true,
  },
];

/** Pill tabs of the clinic space. On a phone they scroll sideways. */
export function ClinicTabs({
  current,
  owner,
}: {
  current: ClinicTab;
  owner: boolean;
}) {
  return (
    <nav
      aria-label="Clinic"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1.5">
        {TABS.filter((t) => owner || !t.ownerOnly).map((t) => (
          <li key={t.id}>
            <Link
              href={t.href}
              aria-current={t.id === current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center whitespace-nowrap rounded-full px-4",
                t.id === current ? "bg-accent font-semibold" : "hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
