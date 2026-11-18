import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UpcomingBookings } from "@/features/clinic-bookings/components/upcoming-bookings";
import { getUpcomingBookings } from "@/features/clinic-bookings/queries";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { requireUser } from "@/server/auth";

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

  return (
    <ClinicShell
      clinicName={clinic.name}
      tabs={{ current: "bookings", role: "owner" }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          Bookings
        </h1>
        <p className="text-muted-foreground">
          Every session from today on. Open one to cancel and refund it.
        </p>
      </div>
      <UpcomingBookings bookings={bookings} />
    </ClinicShell>
  );
}
