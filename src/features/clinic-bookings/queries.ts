import "server-only";
import { brusselsToday } from "@/features/availability/schema";
import { lapsedHold } from "@/features/booking/history";
import { addDays, brusselsInstant } from "@/features/booking/time";
import { clinicBookings } from "@/features/dashboard/queries";
import { clinicPatients } from "@/features/patients/queries";
import { withRls } from "@/lib/db";

// The owner's bookings (checklist #5, #13): every session from today on, and
// one booking to cancel. Patients are known by the email of their account,
// read through private.clinic_patients() like the patient list.

/** Every session from today on for a year, soonest first, never-paid holds aside. */
export async function getUpcomingBookings(
  userId: string,
  clinicId: string,
  now = new Date(),
) {
  const today = brusselsToday(now);
  const range = {
    from: brusselsInstant(today, "00:00"),
    to: brusselsInstant(addDays(today, 366), "00:00"),
  };
  const { rows, patients } = await withRls(userId, async (tx) => ({
    rows: await clinicBookings(tx, clinicId, range),
    patients: await clinicPatients(tx, clinicId, now),
  }));
  const emails = new Map(patients.map((p) => [p.id, p.email]));
  return rows
    .filter((r) => !lapsedHold(r, now))
    .sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime())
    .map((r) => ({
      ...r,
      // Staff who book for themselves are not in the patient list.
      patientEmail: emails.get(r.patientMembershipId ?? "") ?? null,
    }));
}

export type UpcomingBooking = Awaited<
  ReturnType<typeof getUpcomingBookings>
>[number];
