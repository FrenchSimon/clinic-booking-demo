import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getTeam } from "@/features/invitations/queries";
import { ServiceForm } from "@/features/services/components/service-form";
import { ServicePage } from "@/features/services/components/service-page";
import { getDictionary } from "@/i18n/server";
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
  const { locale, t } = await getDictionary();

  return (
    <ServicePage clinic={clinic} title={t.team.services.add}>
      <ServiceForm physios={physios} locale={locale} t={t.team.serviceForm} />
    </ServicePage>
  );
}
