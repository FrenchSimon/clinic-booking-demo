import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UpcomingBookings } from "@/features/clinic-bookings/components/upcoming-bookings";
import { getUpcomingBookings } from "@/features/clinic-bookings/queries";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.clinic.bookings.title}${t.meta.suffix}` };
}

// The owner's bookings from today on (checklist #5), where each booking
// opens to be cancelled (#13). Physios are sent back to their agenda.
export default function ClinicBookingsPage() {
  return (
    <Suspense fallback={null}>
      <Bookings />
    </Suspense>
  );
}

async function Bookings() {
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const bookings = await getUpcomingBookings(user.id, clinic.id);
  const { t } = await getDictionary();

  return (
    <ClinicShell clinic={clinic} tabs={{ current: "bookings", role: "owner" }}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {t.clinic.bookings.title}
        </h1>
        <p className="text-muted-foreground">{t.clinic.bookings.intro}</p>
      </div>
      <UpcomingBookings bookings={bookings} />
    </ClinicShell>
  );
}
