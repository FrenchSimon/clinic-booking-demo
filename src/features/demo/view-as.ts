import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { bookings } from "@/features/booking/table";
import {
  clinics,
  type MembershipRole,
  memberships,
} from "@/features/clinics/table";
import type { adminDb } from "@/lib/db";
import { DEMO_STAND_INS } from "./plan";

type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

/**
 * Swaps two accounts of a clinic: their memberships, so each takes the
 * other's role, hours and agenda, and the bookings they made as patients.
 * One role per person and clinic: a throwaway account holds the first
 * membership while the second one moves, and is gone at the end.
 */
async function swapAccounts(tx: Tx, clinicId: string, a: string, b: string) {
  const spare = randomUUID();
  await tx.execute(sql`insert into auth.users (id, aud, role, raw_app_meta_data, created_at)
    values (${spare}, 'authenticated', 'authenticated', '{"kinora_demo": true}', now())`);
  const move = (from: string, to: string) =>
    tx
      .update(memberships)
      .set({ userId: to })
      .where(
        and(eq(memberships.clinicId, clinicId), eq(memberships.userId, from)),
      );
  await move(a, spare);
  await move(b, a);
  await move(spare, b);
  await tx
    .update(bookings)
    .set({
      patientId: sql`case when ${bookings.patientId} = ${a}::uuid then ${b}::uuid else ${a}::uuid end`,
    })
    .where(
      and(eq(bookings.clinicId, clinicId), inArray(bookings.patientId, [a, b])),
    );
  await tx.execute(sql`delete from auth.users where id = ${spare}`);
}

/** The account in the clinic holding a role, or the seeded stand-in for it. */
async function accountFor(tx: Tx, clinicId: string, role: MembershipRole) {
  const rows = await tx.execute<{ id: string }>(sql`
    select m.user_id as id from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.clinic_id = ${clinicId}
      and ${
        role === "owner"
          ? sql`m.role = 'owner'`
          : sql`m.role = ${role} and split_part(u.email, '@', 1) = ${DEMO_STAND_INS[role]}`
      }`);
  const id = rows[0]?.id;
  if (!id)
    throw new Error(`No ${role} to swap with in demo clinic ${clinicId}`);
  return id;
}

/**
 * "View as" (checklist #20): makes the visitor the owner, a practitioner or a
 * patient of their demo clinic for real, so row level security applies to
 * them like to anyone with that role. The visitor first gets the owner's
 * place back, then swaps with Camille or Nora: only one seeded account is
 * ever out of place, and it holds the owner's role. Returns false when the
 * visitor has no demo clinic.
 */
export async function switchDemoRole(
  tx: Tx,
  visitorId: string,
  role: MembershipRole,
): Promise<boolean> {
  // Locks the clinic: two clicks at once switch one after the other.
  const [clinic] = await tx
    .select({ id: clinics.id, role: memberships.role })
    .from(clinics)
    .innerJoin(
      memberships,
      and(
        eq(memberships.clinicId, clinics.id),
        eq(memberships.userId, visitorId),
      ),
    )
    .where(eq(clinics.createdBy, visitorId))
    .for("update", { of: clinics });
  if (!clinic) return false;
  if (clinic.role === role) return true;
  if (clinic.role !== "owner") {
    await swapAccounts(
      tx,
      clinic.id,
      visitorId,
      await accountFor(tx, clinic.id, "owner"),
    );
  }
  if (role !== "owner") {
    await swapAccounts(
      tx,
      clinic.id,
      visitorId,
      await accountFor(tx, clinic.id, role),
    );
  }
  return true;
}
