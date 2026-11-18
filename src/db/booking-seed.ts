// Bookings for the database tests: a clinic from seedTwoClinics gets a
// service, a second physio, and helpers to insert bookings as the owner of
// the database (no one may insert them as themselves).
import { and, eq } from "drizzle-orm";
import type { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import { services } from "@/features/services/table";
import { createUser } from "./test-seed";
import { one, type Tx } from "./test-support";

export async function membershipId(tx: Tx, clinicId: string, userId: string) {
  return one(
    await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(eq(memberships.clinicId, clinicId), eq(memberships.userId, userId)),
      ),
  ).id;
}

/** Adds a 30-minute service and a second physio to a seeded clinic. */
export async function bookable(
  tx: Tx,
  clinic: { id: string; practitioner: string },
) {
  const service = one(
    await tx
      .insert(services)
      .values({
        clinicId: clinic.id,
        name: "Follow-up",
        durationMinutes: 30,
        priceCents: 4500,
      })
      .returning({ id: services.id }),
  );
  const colleague = await createUser(tx);
  await tx
    .insert(memberships)
    .values({ clinicId: clinic.id, userId: colleague, role: "practitioner" });
  return {
    serviceId: service.id,
    physio: await membershipId(tx, clinic.id, clinic.practitioner),
    colleague,
    colleaguePhysio: await membershipId(tx, clinic.id, colleague),
  };
}

export type NewBooking = {
  clinicId: string;
  serviceId: string;
  membershipId: string;
  patientId: string;
  /** ISO instant; the booking lasts 30 minutes unless `endsAt` is given. */
  startsAt: string;
  endsAt?: string;
  status?: (typeof bookings.$inferInsert)["status"];
};

/** The row to insert, with a hold expiry for pending payments. */
export function bookingRow(b: NewBooking) {
  const startsAt = new Date(b.startsAt);
  return {
    ...b,
    startsAt,
    endsAt: b.endsAt
      ? new Date(b.endsAt)
      : new Date(startsAt.getTime() + 30 * 60_000),
    priceCents: 4500,
    status: b.status ?? "confirmed",
    holdExpiresAt: new Date(Date.now() + 15 * 60_000),
  };
}
