import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClinicForm } from "@/features/clinics/components/clinic-form";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getStaffClinic } from "@/features/clinics/queries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.clinic.setup.title}${t.meta.suffix}` };
}

export default async function NewClinicPage() {
  const { t } = await getDictionary();
  return (
    <ClinicShell>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {t.clinic.setup.title}
        </h1>
        <p className="text-muted-foreground">{t.clinic.setup.intro}</p>
      </div>
      <div className="rounded-[18px] border bg-card p-5 sm:p-8">
        <Suspense fallback={null}>
          <NewClinic />
        </Suspense>
      </div>
    </ClinicShell>
  );
}

async function NewClinic() {
  const user = await requireUser();
  if (await getStaffClinic(user.id)) redirect("/clinic");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const { t } = await getDictionary();
  const { title: _, intro: __, ...form } = t.clinic.setup;
  return (
    <ClinicForm
      origin={host}
      t={form}
      hours={{ days: t.clinic.days, ...t.clinic.hours }}
    />
  );
}
