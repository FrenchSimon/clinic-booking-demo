import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { PatientList } from "@/features/patients/components/patient-list";
import { getPatients } from "@/features/patients/queries";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.clinic.patients.title}${t.meta.suffix}` };
}

// The owner's patient list (checklist #16). Physios have no access: the
// page sends them back, and private.clinic_patients() gives them nobody.
export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <Patients />
    </Suspense>
  );
}

async function Patients() {
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const patients = await getPatients(user.id, clinic.id);
  const { t } = await getDictionary();

  return (
    <ClinicShell clinic={clinic} tabs={{ current: "patients", role: "owner" }}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {t.clinic.patients.title}
        </h1>
        <p className="text-muted-foreground">
          {fill(t.clinic.patients.intro, { clinic: clinic.name })}
        </p>
      </div>
      <PatientList patients={patients} />
    </ClinicShell>
  );
}
