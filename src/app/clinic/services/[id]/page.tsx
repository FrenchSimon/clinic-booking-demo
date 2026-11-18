import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getTeam } from "@/features/invitations/queries";
import { ServiceForm } from "@/features/services/components/service-form";
import { ServicePage } from "@/features/services/components/service-page";
import { getService } from "@/features/services/queries";
import { requireUser } from "@/server/auth";

export default function EditServicePage({
  params,
}: PageProps<"/clinic/services/[id]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ id }) => (
        <EditService id={id} />
      ))}
    </Suspense>
  );
}

async function EditService({ id }: { id: string }) {
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const [service, team] = await Promise.all([
    getService(user.id, clinic.id, id),
    getTeam(user.id, clinic.id),
  ]);
  if (!service) notFound();

  return (
    <ServicePage clinicName={clinic.name} title={service.name}>
      <ServiceForm physios={team.physios} service={service} />
    </ServicePage>
  );
}
