import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClinicForm } from "@/features/clinics/components/clinic-form";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getStaffClinic } from "@/features/clinics/queries";
import { requireUser } from "@/server/auth";

export default function NewClinicPage() {
  return (
    <ClinicShell>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          Set up your clinic
        </h1>
        <p className="text-muted-foreground">
          Patients will see this on your booking page. You can add your physios
          and services next.
        </p>
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
  return <ClinicForm origin={host} />;
}
