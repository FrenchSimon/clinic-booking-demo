import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getDictionary } from "@/i18n/server";
import type { MembershipRole } from "../table";
import { type ClinicTab, ClinicTabs } from "./clinic-tabs";

/**
 * Frame of the clinic space: top bar, then the tabs once the clinic exists.
 * The top bar links to the clinic's public booking page, the one patients use.
 */
export async function ClinicShell({
  clinic,
  tabs,
  children,
}: {
  clinic?: { name: string; slug: string };
  tabs?: { current: ClinicTab; role: MembershipRole };
  children: ReactNode;
}) {
  const { t } = await getDictionary();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-heading font-semibold text-2xl text-primary"
            >
              Kinora
            </Link>
            {clinic && (
              <span className="hidden truncate text-muted-foreground sm:inline">
                {clinic.name}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {clinic && (
              <Link
                href={`/c/${clinic.slug}`}
                className="flex min-h-11 items-center gap-1 whitespace-nowrap font-semibold text-primary"
              >
                <span className="sm:hidden">
                  {t.clinic.shell.bookingPageShort}
                </span>
                <span className="hidden sm:inline">
                  {t.clinic.shell.bookingPage}
                </span>
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        {tabs && <ClinicTabs {...tabs} t={t.clinic.shell} />}
        {children}
      </main>
    </div>
  );
}
