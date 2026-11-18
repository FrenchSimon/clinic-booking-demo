import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { type ClinicTab, ClinicTabs } from "./clinic-tabs";

/** Frame of the clinic space: top bar, then the tabs once the clinic exists. */
export function ClinicShell({
  clinicName,
  tabs,
  children,
}: {
  clinicName?: string;
  tabs?: { current: ClinicTab; owner: boolean };
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link
              href="/"
              className="font-heading font-semibold text-2xl text-primary"
            >
              Kinora
            </Link>
            {clinicName && (
              <span className="truncate text-muted-foreground">
                {clinicName}
              </span>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        {tabs && <ClinicTabs {...tabs} />}
        {children}
      </main>
    </div>
  );
}
