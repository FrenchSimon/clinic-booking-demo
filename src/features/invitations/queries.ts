import "server-only";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { memberships } from "@/features/clinics/table";
import { withRls } from "@/lib/db";
import { invitations } from "./table";

export type Team = {
  physios: { id: string; name: string }[];
  pending: { id: string; name: string; email: string; expiresAt: Date }[];
};

/** The clinic's physios and open invitations, read through RLS (owners only). */
export async function getTeam(userId: string, clinicId: string): Promise<Team> {
  return withRls(userId, async (tx) => {
    const physios = await tx
      .select({ id: memberships.id, name: memberships.displayName })
      .from(memberships)
      .where(
        and(
          eq(memberships.clinicId, clinicId),
          eq(memberships.role, "practitioner"),
        ),
      )
      .orderBy(asc(memberships.displayName));
    const pending = await tx
      .select({
        id: invitations.id,
        name: invitations.name,
        email: invitations.email,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.clinicId, clinicId),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .orderBy(asc(invitations.createdAt));
    return {
      physios: physios.map((p) => ({ id: p.id, name: p.name ?? "Physio" })),
      pending,
    };
  });
}
