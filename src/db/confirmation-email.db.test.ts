// Checklist #14: a paid booking queues one confirmation email to its
// patient, however often the payment is settled.
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { emails } from "@/features/email/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, one, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { queueConfirmationEmail } = await import(
  "@/features/booking/confirmation"
);

afterAll(closeTestDb);

const ORIGIN = "https://kinora-booking.vercel.app";

async function seed(tx: Tx) {
  const { a } = await seedTwoClinics(tx);
  const inA = await bookable(tx, a);
  const booking = one(
    await tx
      .insert(bookings)
      .values({
        ...bookingRow({
          clinicId: a.id,
          serviceId: inA.serviceId,
          membershipId: inA.physio,
          patientId: a.patient,
          startsAt: "2026-12-01T09:00:00Z",
        }),
        stripeCheckoutSessionId: "cs_test_mail",
      })
      .returning({ id: bookings.id }),
  );
  return { a, bookingId: booking.id };
}

describe("queueConfirmationEmail", () => {
  it("queues one email to the patient with a link to the booking", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx);
      const id = await queueConfirmationEmail(tx, "cs_test_mail", ORIGIN);
      expect(id).not.toBeNull();

      const email = one(
        await tx
          .select()
          .from(emails)
          .where(eq(emails.id, id ?? "")),
      );
      expect(email.clinicId).toBe(a.id);
      expect(email.kind).toBe("booking_confirmation");
      expect(email.status).toBe("pending");
      expect(email.toEmail).toBe(`${a.patient}@test.kinora.invalid`);
      expect(email.text).toContain("Follow-up");
      expect(email.text).toContain("Tuesday 1 December at 10:00");
      expect(email.text).toContain(`${ORIGIN}/bookings/${bookingId}`);
    });
  });

  it("queues nothing the second time", async () => {
    await rolledBack(async (tx) => {
      const { bookingId } = await seed(tx);
      await queueConfirmationEmail(tx, "cs_test_mail", ORIGIN);
      expect(await queueConfirmationEmail(tx, "cs_test_mail", ORIGIN)).toBe(
        null,
      );
      const rows = await tx
        .select({ id: emails.id })
        .from(emails)
        .where(eq(emails.dedupeKey, `booking_confirmation:${bookingId}`));
      expect(rows).toHaveLength(1);
    });
  });

  it("queues nothing for a session that is not a booking", async () => {
    await rolledBack(async (tx) => {
      await seed(tx);
      expect(await queueConfirmationEmail(tx, "cs_test_other", ORIGIN)).toBe(
        null,
      );
    });
  });
});
