// Checklist #19: "Try the demo" gives the visitor their own clinic, already
// filled, which they own and nobody else can read.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { clinics, memberships } from "@/features/clinics/table";
import { demoBookings } from "@/features/demo/plan";
import { services } from "@/features/services/table";
import { createUser } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { seedDemoClinic } = await import("@/features/demo/seed");

afterAll(closeTestDb);

const NOW = new Date("2030-03-05T10:00:00Z");

async function seed(tx: Tx) {
  const visitor = await createUser(tx);
  const rows = demoBookings(NOW).map((b) => ({
    ...b,
    id: randomUUID(),
    paymentIntentId: b.status === "confirmed" ? "pi_test_demo" : null,
  }));
  const clinicId = await seedDemoClinic(tx, visitor, rows);
  return { visitor, clinicId, rows };
}

describe("seedDemoClinic", () => {
  it("makes the visitor the owner of a filled clinic", async () => {
    await rolledBack(async (tx) => {
      const { visitor, clinicId, rows } = await seed(tx);
      const seen = await asUser(tx, visitor, async (as) => ({
        roles: await as
          .select({ role: memberships.role, userId: memberships.userId })
          .from(memberships)
          .where(eq(memberships.clinicId, clinicId)),
        services: await as.select().from(services),
        bookings: await as.select().from(bookings),
      }));

      const roleOf = (role: string) =>
        seen.roles.filter((m) => m.role === role);
      expect(roleOf("owner").map((m) => m.userId)).toEqual([visitor]);
      expect(roleOf("practitioner")).toHaveLength(3);
      expect(roleOf("patient")).toHaveLength(6);
      expect(seen.services).toHaveLength(3);
      expect(seen.bookings).toHaveLength(rows.length);
      const statuses = new Set(seen.bookings.map((b) => b.status));
      expect([...statuses].sort()).toEqual(["confirmed", "refunded"]);
    });
  });

  it("is invisible to anyone else", async () => {
    await rolledBack(async (tx) => {
      const { clinicId } = await seed(tx);
      const stranger = await createUser(tx);
      const seen = await asUser(tx, stranger, async (as) => ({
        clinics: await as
          .select()
          .from(clinics)
          .where(eq(clinics.id, clinicId)),
        bookings: await as
          .select()
          .from(bookings)
          .where(eq(bookings.clinicId, clinicId)),
      }));
      expect(seen).toEqual({ clinics: [], bookings: [] });
    });
  });

  it("marks the team and patients as demo accounts", async () => {
    await rolledBack(async (tx) => {
      const { clinicId } = await seed(tx);
      const rows = await tx.execute<{ demo: boolean; tokens: boolean }>(
        sql`select u.raw_app_meta_data->>'kinora_demo' = 'true' as demo,
              u.confirmation_token = '' and u.recovery_token = ''
                and u.created_at is not null as tokens
            from public.memberships m join auth.users u on u.id = m.user_id
            where m.clinic_id = ${clinicId} and m.role <> 'owner'`,
      );
      expect(rows).toHaveLength(9);
      expect(rows.every((r) => r.demo && r.tokens)).toBe(true);
    });
  });
});
