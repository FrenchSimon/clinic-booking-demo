import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { OpeningHoursList } from "@/features/clinics/components/opening-hours-list";
import { getStaffClinic } from "@/features/clinics/queries";
import { TeamSection } from "@/features/invitations/components/team-section";
import { FirstServiceHint } from "@/features/services/components/first-service-hint";
import { requireUser } from "@/server/auth";

// Temporary clinic home for owners and physios: the dashboards replace it in R3.
export default function ClinicPage() {
  return (
    <Suspense fallback={null}>
      <ClinicOverview />
    </Suspense>
  );
}

async function ClinicOverview() {
  const user = await requireUser();
  const mine = await getStaffClinic(user.id);
  if (!mine) redirect("/clinic/new");
  const { clinic, role } = mine;

  return (
    <ClinicShell
      clinicName={clinic.name}
      tabs={{ current: "today", owner: role === "owner" }}
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-oak text-sm uppercase tracking-[0.08em]">
          {role === "owner" ? "Your clinic" : "You work at"}
        </p>
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {clinic.name}
        </h1>
        <p className="text-muted-foreground">{clinic.address}</p>
      </div>
      {role === "owner" && (
        <FirstServiceHint userId={user.id} clinicId={clinic.id} />
      )}
      <section
        aria-labelledby="hours-title"
        className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="hours-title" className="font-heading font-semibold text-xl">
          Opening hours
        </h2>
        <OpeningHoursList hours={clinic.openingHours} />
      </section>
      {role === "owner" ? (
        <TeamSection userId={user.id} clinicId={clinic.id} />
      ) : (
        <p className="rounded-[18px] border bg-card p-5 sm:p-8">
          You are a physio at {clinic.name}. Your agenda with your sessions
          arrives here soon.
        </p>
      )}
      <p className="text-muted-foreground text-sm">
        Booking page address: /c/{clinic.slug}
      </p>
    </ClinicShell>
  );
}
