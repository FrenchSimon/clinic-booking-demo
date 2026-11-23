import Link from "next/link";
import type { ReactNode } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getDictionary } from "@/i18n/server";

/** Frame of the add and edit pages: title, back link, then the form in a card. */
export async function ServicePage({
  clinic,
  title,
  children,
}: {
  clinic: { name: string; slug: string };
  title: string;
  children: ReactNode;
}) {
  const { t } = await getDictionary();
  return (
    <ClinicShell clinic={clinic} tabs={{ current: "services", role: "owner" }}>
      <div className="flex flex-col gap-1">
        <Link
          href="/clinic/services"
          className="flex min-h-11 items-center self-start text-primary underline-offset-4 hover:underline"
        >
          {t.team.services.allServices}
        </Link>
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {title}
        </h1>
      </div>
      <div className="rounded-[18px] border bg-card p-5 sm:p-8">{children}</div>
    </ClinicShell>
  );
}
