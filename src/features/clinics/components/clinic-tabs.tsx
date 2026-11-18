import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MembershipRole } from "../table";

export type ClinicTab = "today" | "services" | "hours";

const TABS: {
  id: ClinicTab;
  label: string;
  href: string;
  roles: MembershipRole[];
}[] = [
  {
    id: "today",
    label: "Today",
    href: "/clinic",
    roles: ["owner", "practitioner"],
  },
  {
    id: "services",
    label: "Services",
    href: "/clinic/services",
    roles: ["owner"],
  },
  {
    id: "hours",
    label: "My hours",
    href: "/clinic/hours",
    roles: ["practitioner"],
  },
];

/** Pill tabs of the clinic space, by role. On a phone they scroll sideways. */
export function ClinicTabs({
  current,
  role,
}: {
  current: ClinicTab;
  role: MembershipRole;
}) {
  return (
    <nav
      aria-label="Clinic"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1.5">
        {TABS.filter((t) => t.roles.includes(role)).map((t) => (
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
