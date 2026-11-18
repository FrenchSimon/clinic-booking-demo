import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getTeam } from "@/features/invitations/queries";
import { ServiceForm } from "@/features/services/components/service-form";
import { ServicePage } from "@/features/services/components/service-page";
import { requireUser } from "@/server/auth";

export default function NewServicePage() {
  return (
    <Suspense fallback={null}>
      <NewService />
    </Suspense>
  );
}

async function NewService() {
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const { physios } = await getTeam(user.id, clinic.id);

  return (
    <ServicePage clinicName={clinic.name} title="Add a service">
      <ServiceForm physios={physios} />
    </ServicePage>
  );
}
