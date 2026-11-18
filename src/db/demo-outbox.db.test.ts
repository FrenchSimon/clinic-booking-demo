// Checklist #21: no real email leaves a demo clinic. The database holds every
// email of a clinic an anonymous visitor started, and that visitor reads them
// in the Outbox whatever role "View as" gave them.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { demoBookings } from "@/features/demo/plan";
import { emails } from "@/features/email/table";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { queueEmail } = await import("@/features/email/outbox");
const { seedDemoClinic } = await import("@/features/demo/seed");
const { switchDemoRole } = await import("@/features/demo/view-as");

afterAll(closeTestDb);

const rows = () =>
  demoBookings(new Date("2030-03-05T10:00:00Z")).map((b) => ({
    ...b,
    id: randomUUID(),
    paymentIntentId: null,
  }));

async function anonymousVisitor(tx: Tx) {
  const id = randomUUID();
  await tx.execute(
    sql`insert into auth.users (id, aud, role, is_anonymous, created_at)
        values (${id}, 'authenticated', 'authenticated', true, now())`,
  );
  return id;
}

const queue = (tx: Tx, clinicId: string, to: string) =>
  queueEmail(tx, {
    clinicId,
    kind: "booking_confirmation",
    dedupeKey: `test:${randomUUID()}`,
    to,
    content: { heading: "Your session is confirmed", paragraphs: [] },
  });

const statusOf = async (tx: Tx, id: string | null) => {
  const [row] = await tx
    .select({ status: emails.status })
    .from(emails)
    .where(eq(emails.id, id ?? ""));
  return row?.status;
};

describe("emails of a demo clinic", () => {
  it("are held, never pending", async () => {
    await rolledBack(async (tx) => {
      const visitor = await anonymousVisitor(tx);
      const clinicId = await seedDemoClinic(tx, visitor, rows());
      const id = await queue(tx, clinicId, "real.person@gmail.com");
      expect(await statusOf(tx, id)).toBe("held");
    });
  });

  it("are read by their visitor in every role, and by nobody else", async () => {
    await rolledBack(async (tx) => {
      const visitor = await anonymousVisitor(tx);
      const clinicId = await seedDemoClinic(tx, visitor, rows());
      const id = await queue(tx, clinicId, "nora@demo.example");
      const { a } = await seedTwoClinics(tx);
      const seen = (userId: string) =>
        asUser(tx, userId, (as) =>
          as
            .select({ id: emails.id })
            .from(emails)
            .where(eq(emails.id, id ?? "")),
        );

      expect(await seen(visitor)).toHaveLength(1);
      await switchDemoRole(tx, visitor, "patient");
      expect(await seen(visitor)).toHaveLength(1);
      expect(await seen(a.owner)).toEqual([]);
    });
  });
});

describe("emails of a real clinic", () => {
  it("are sent, unless the address is a reserved .example one", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      expect(
        await statusOf(tx, await queue(tx, a.id, "p@test.kinora.invalid")),
      ).toBe("pending");
      expect(
        await statusOf(tx, await queue(tx, a.id, "you@demo-visitor.example")),
      ).toBe("held");
    });
  });
});
