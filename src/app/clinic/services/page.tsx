import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { ServiceList } from "@/features/services/components/service-list";
import { listServices } from "@/features/services/queries";
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

  return (
    <ClinicShell
      clinicName={clinic.name}
      tabs={{ current: "services", owner: true }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-normal text-3xl sm:text-4xl">
            Services
          </h1>
          <p className="text-muted-foreground">
            The sessions patients book and pay online.
          </p>
        </div>
        <Link href="/clinic/services/new" className={buttonVariants()}>
          Add a service
        </Link>
      </div>
      <ServiceList services={services} />
    </ClinicShell>
  );
}
