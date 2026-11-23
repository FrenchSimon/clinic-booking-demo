import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { MembershipRole } from "../table";

export type ClinicTab =
  | "today"
  | "bookings"
  | "patients"
  | "services"
  | "hours";

const TABS: {
  id: ClinicTab;
  href: string;
  roles: MembershipRole[];
}[] = [
  {
    id: "today",
    href: "/clinic",
    roles: ["owner", "practitioner"],
  },
  {
    id: "bookings",
    href: "/clinic/bookings",
    roles: ["owner"],
  },
  {
    id: "patients",
    href: "/clinic/patients",
    roles: ["owner"],
  },
  {
    id: "services",
    href: "/clinic/services",
    roles: ["owner"],
  },
  {
    id: "hours",
    href: "/clinic/hours",
    roles: ["practitioner"],
  },
];

/** Pill tabs of the clinic space, by role. On a phone they scroll sideways. */
export function ClinicTabs({
  current,
  role,
  t,
}: {
  current: ClinicTab;
  role: MembershipRole;
  t: Dictionary["clinic"]["shell"];
}) {
  return (
    <nav
      aria-label={t.tabsLabel}
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1.5">
        {TABS.filter((tab) => tab.roles.includes(role)).map((tab) => (
          <li key={tab.id}>
            <Link
              href={tab.href}
              aria-current={tab.id === current ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center whitespace-nowrap rounded-full px-4",
                tab.id === current
                  ? "bg-accent font-semibold"
                  : "hover:bg-muted",
              )}
            >
              {t.tabs[tab.id]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
