// Checklist #14: a refunded booking queues one cancellation email to its
// patient, saying who cancelled, however often the refund is confirmed.
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { emails } from "@/features/email/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, one, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { queueCancellationEmail } = await import(
  "@/features/booking/cancellation-email"
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
        status: "refunded",
      })
      .returning({ id: bookings.id }),
  );
  return { a, bookingId: booking.id };
}

const emailById = async (tx: Tx, id: string | null) =>
  one(
    await tx
      .select()
      .from(emails)
      .where(eq(emails.id, id ?? "")),
  );

describe("queueCancellationEmail", () => {
  it("queues one email to the patient with the refund and a link", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx);
      const id = await queueCancellationEmail(tx, bookingId, a.patient, ORIGIN);
      const email = await emailById(tx, id);
      expect(email.clinicId).toBe(a.id);
      expect(email.kind).toBe("booking_cancellation");
      expect(email.status).toBe("pending");
      expect(email.toEmail).toBe(`${a.patient}@test.kinora.invalid`);
      expect(email.text).toContain("You cancelled your session");
      expect(email.text).toContain("Tuesday 1 December at 10:00");
      expect(email.text).toContain("€45.00 is refunded in full");
      expect(email.text).toContain(`${ORIGIN}/bookings/${bookingId}`);
    });
  });

  it("says the clinic cancelled when the owner did", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx);
      const id = await queueCancellationEmail(tx, bookingId, a.owner, ORIGIN);
      const email = await emailById(tx, id);
      expect(email.toEmail).toBe(`${a.patient}@test.kinora.invalid`);
      expect(email.text).toContain("Clinic A cancelled your session");
    });
  });

  it("queues nothing the second time", async () => {
    await rolledBack(async (tx) => {
      const { a, bookingId } = await seed(tx);
      await queueCancellationEmail(tx, bookingId, a.patient, ORIGIN);
      expect(
        await queueCancellationEmail(tx, bookingId, a.owner, ORIGIN),
      ).toBeNull();
      const rows = await tx
        .select({ id: emails.id })
        .from(emails)
        .where(eq(emails.dedupeKey, `booking_cancellation:${bookingId}`));
      expect(rows).toHaveLength(1);
    });
  });
});
