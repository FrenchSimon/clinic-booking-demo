import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PhysioAgenda } from "@/features/agenda/components/physio-agenda";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { OpeningHoursList } from "@/features/clinics/components/opening-hours-list";
import { getStaffClinic } from "@/features/clinics/queries";
import { OwnerDashboard } from "@/features/dashboard/components/owner-dashboard";
import { DemoNotice } from "@/features/demo/components/demo-notice";
import { TeamSection } from "@/features/invitations/components/team-section";
import { FirstServiceHint } from "@/features/services/components/first-service-hint";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.clinic.overview.title}${t.meta.suffix}` };
}

// The clinic's Today tab: the owner's dashboard (checklist #16) or the
// physio's agenda for the day and the week (#17), then the opening hours.
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
  const { t } = await getDictionary();

  return (
    <ClinicShell clinic={clinic} tabs={{ current: "today", role }}>
      {user.is_anonymous && <DemoNotice startedAt={user.created_at} />}
      {role === "owner" ? (
        <>
          <FirstServiceHint userId={user.id} clinicId={clinic.id} />
          <OwnerDashboard userId={user.id} clinicId={clinic.id} />
        </>
      ) : (
        <PhysioAgenda userId={user.id} clinicId={clinic.id} />
      )}
      <section
        aria-labelledby="hours-title"
        className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="hours-title" className="font-heading font-semibold text-xl">
          {t.clinic.overview.openingHours}
        </h2>
        <OpeningHoursList hours={clinic.openingHours} />
      </section>
      {role === "owner" ? (
        <TeamSection userId={user.id} clinicId={clinic.id} />
      ) : (
        <section className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8">
          <p>
            {fill(t.clinic.overview.physioAt, {
              clinic: clinic.name,
              address: clinic.address,
            })}
          </p>
          <Link
            href="/clinic/hours"
            className="flex min-h-11 items-center self-start text-primary underline underline-offset-4"
          >
            {t.clinic.overview.setMyHours}
          </Link>
        </section>
      )}
      <p className="text-muted-foreground text-sm">
        {fill(t.clinic.overview.bookingAddress, { slug: clinic.slug })}
      </p>
    </ClinicShell>
  );
}
