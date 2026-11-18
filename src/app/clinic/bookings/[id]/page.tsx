import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BackLink } from "@/components/back-link";
import { ClinicBookingCard } from "@/features/clinic-bookings/components/clinic-booking-card";
import {
  OWNER_CANCEL_ERRORS,
  OwnerCancelSection,
} from "@/features/clinic-bookings/components/owner-cancel-section";
import { getClinicBooking } from "@/features/clinic-bookings/queries";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { requireUser } from "@/server/auth";

// One booking of the clinic, where the owner cancels it with a full refund
// (checklist #13). Only the clinic's owner sees it.
export default function ClinicBookingPage({
  params,
  searchParams,
}: PageProps<"/clinic/bookings/[id]">) {
  return (
    <Suspense fallback={null}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Booking
          id={id}
          confirming={query.cancel === "confirm"}
          error={OWNER_CANCEL_ERRORS[String(query.error)]}
        />
      ))}
    </Suspense>
  );
}

async function Booking({
  id,
  confirming,
  error,
}: {
  id: string;
  confirming: boolean;
  error: string | undefined;
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser();
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) redirect("/clinic");
  const booking = await getClinicBooking(user.id, clinic.id, id);
  if (!booking) notFound();

  return (
    <ClinicShell
      clinicName={clinic.name}
      tabs={{ current: "bookings", role: "owner" }}
    >
      <BackLink href="/clinic/bookings" label="All bookings" />
      {error && (
        <p role="alert" className="rounded-[14px] border bg-card p-4">
          {error}
        </p>
      )}
      <ClinicBookingCard booking={booking} />
      <OwnerCancelSection booking={booking} confirming={confirming} />
    </ClinicShell>
  );
}
