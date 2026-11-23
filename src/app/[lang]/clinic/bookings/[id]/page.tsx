import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BackLink } from "@/components/back-link";
import { ClinicBookingCard } from "@/features/clinic-bookings/components/clinic-booking-card";
import { OwnerCancelSection } from "@/features/clinic-bookings/components/owner-cancel-section";
import { getClinicBooking } from "@/features/clinic-bookings/queries";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.clinic.bookings.detailTitle}${t.meta.suffix}` };
}

// One booking of the clinic, where the owner cancels it with a full refund
// (checklist #13). Only the clinic's owner sees it.
export default function ClinicBookingPage({
  params,
  searchParams,
}: PageProps<"/[lang]/clinic/bookings/[id]">) {
  return (
    <Suspense fallback={null}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Booking
          id={id}
          confirming={query.cancel === "confirm"}
          error={String(query.error)}
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
  const { t } = await getDictionary();
  // What cancelClinicBooking() sends back in ?error=.
  const errors: Record<string, string> = t.clinic.cancel.errors;
  const message =
    error && Object.hasOwn(errors, error) ? errors[error] : undefined;

  return (
    <ClinicShell clinic={clinic} tabs={{ current: "bookings", role: "owner" }}>
      <BackLink href="/clinic/bookings" label={t.clinic.bookings.back} />
      {message && (
        <p role="alert" className="rounded-[14px] border bg-card p-4">
          {message}
        </p>
      )}
      <ClinicBookingCard booking={booking} />
      <OwnerCancelSection booking={booking} confirming={confirming} />
    </ClinicShell>
  );
}
