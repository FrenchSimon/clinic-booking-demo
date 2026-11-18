import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { PatientList } from "@/features/patients/components/patient-list";
import { getPatients } from "@/features/patients/queries";
import { requireUser } from "@/server/auth";

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

  return (
    <ClinicShell
      clinicName={clinic.name}
      tabs={{ current: "patients", role: "owner" }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          Patients
        </h1>
        <p className="text-muted-foreground">
          Everyone who booked at {clinic.name}, with their paid sessions.
        </p>
      </div>
      <PatientList patients={patients} />
    </ClinicShell>
  );
}
