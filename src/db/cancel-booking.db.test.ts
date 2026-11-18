// Checklist #12: a patient cancels their own paid booking up to 24 hours
// before, through private.cancel_booking() (drizzle/0018), and the slot is
// free again at once. Nobody else cancels it, and never closer than 24 hours.
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, one, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { cancelInDb } = await import("@/features/booking/cancel");

afterAll(closeTestDb);

const HOUR = 3_600_000;
const inHours = (h: number) => new Date(Date.now() + h * HOUR).toISOString();

async function seed(
  tx: Tx,
  startsInHours: number,
  status: "confirmed" | "pending_payment" = "confirmed",
) {
  const clinics = await seedTwoClinics(tx);
  const { a } = clinics;
  const inA = await bookable(tx, a);
  const row = {
    ...bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.physio,
      patientId: a.patient,
      startsAt: inHours(startsInHours),
    }),
    status,
    stripePaymentIntentId: "pi_test_cancel",
  };
  const booking = one(
    await tx.insert(bookings).values(row).returning({ id: bookings.id }),
  );
  return { ...clinics, inA, row, bookingId: booking.id };
}

const statusOf = async (tx: Tx, id: string) =>
  one(
    await tx
      .select({ status: bookings.status, cancelledAt: bookings.cancelledAt })
      .from(bookings)
      .where(eq(bookings.id, id)),
  );

describe("private.cancel_booking", () => {
  it("cancels a paid booking more than 24 hours ahead and frees the slot", async () => {
    await rolledBack(async (tx) => {
      const { a, inA, row, bookingId } = await seed(tx, 25);
      const result = await asUser(tx, a.patient, (db) =>
        cancelInDb(db, bookingId),
      );
      expect(result).toEqual({ paymentIntentId: "pi_test_cancel" });
      const after = await statusOf(tx, bookingId);
      expect(after.status).toBe("cancelled");
      expect(after.cancelledAt).not.toBeNull();
      // The same physio and time can be booked again.
      await tx.insert(bookings).values({
        ...row,
        patientId: a.otherPatient,
        membershipId: inA.physio,
        stripePaymentIntentId: null,
      });
    });
  });

  it("returns the same payment again so a failed refund can be retried", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx, 48);
      for (let i = 0; i < 2; i++) {
        const result = await asUser(tx, a.patient, (db) =>
          cancelInDb(db, bookingId),
        );
        expect(result).toEqual({ paymentIntentId: "pi_test_cancel" });
      }
    });
  });

  it("refuses within 24 hours of the session", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx, 23);
      const result = await asUser(tx, a.patient, (db) =>
        cancelInDb(db, bookingId),
      );
      expect(result).toEqual({ error: "too_late" });
      expect((await statusOf(tx, bookingId)).status).toBe("confirmed");
    });
  });

  it("refuses a booking that is not paid", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx, 48, "pending_payment");
      const result = await asUser(tx, a.patient, (db) =>
        cancelInDb(db, bookingId),
      );
      expect(result).toEqual({ error: "not_cancellable" });
    });
  });

  it("refuses anyone but the booking's patient", async () => {
    await rolledBack(async (tx) => {
      const { a, b, bookingId } = await seed(tx, 48);
      for (const user of [a.otherPatient, a.practitioner, a.owner, b.owner]) {
        const result = await asUser(tx, user, (db) =>
          cancelInDb(db, bookingId),
        );
        expect(result).toEqual({ error: "not_cancellable" });
      }
      expect((await statusOf(tx, bookingId)).status).toBe("confirmed");
    });
  });
});
