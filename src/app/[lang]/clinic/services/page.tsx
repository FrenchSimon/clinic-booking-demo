import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { ServiceList } from "@/features/services/components/service-list";
import { listServices } from "@/features/services/queries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export default function ServicesPage() {
  return (
    <Suspense fallback={null}>
      <Services />
    </Suspense>
  );
}

async function Services() {
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const services = await listServices(user.id, clinic.id);
  const { t } = await getDictionary();

  return (
    <ClinicShell clinic={clinic} tabs={{ current: "services", role: "owner" }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-normal text-3xl sm:text-4xl">
            {t.team.services.title}
          </h1>
          <p className="text-muted-foreground">{t.team.services.intro}</p>
        </div>
        <Link href="/clinic/services/new" className={buttonVariants()}>
          {t.team.services.add}
        </Link>
      </div>
      <ServiceList services={services} />
    </ClinicShell>
  );
}
