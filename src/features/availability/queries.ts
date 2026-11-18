import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import type { OpeningHours } from "@/features/clinics/schema";
import { memberships } from "@/features/clinics/table";
import { withRls } from "@/lib/db";
import { brusselsToday } from "./schema";
import { type DayOff, daysOff, practitionerHours } from "./table";

export type MySchedule = {
  membershipId: string;
  /** Null until the physio saves their hours: nobody can book them before. */
  weeklyHours: OpeningHours | null;
  /** Today's and later days off, soonest first. */
  daysOff: DayOff[];
};

/** The signed-in physio's schedule in this clinic, or null if they are not a physio there. */
export async function getMySchedule(
  userId: string,
  clinicId: string,
): Promise<MySchedule | null> {
  return withRls(userId, async (tx) => {
    const [me] = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.clinicId, clinicId),
          eq(memberships.userId, userId),
          eq(memberships.role, "practitioner"),
        ),
      );
    if (!me) return null;
    const [hours] = await tx
      .select({ weeklyHours: practitionerHours.weeklyHours })
      .from(practitionerHours)
      .where(eq(practitionerHours.membershipId, me.id));
    const upcoming = await tx
      .select()
      .from(daysOff)
      .where(
        and(
          eq(daysOff.membershipId, me.id),
          gte(daysOff.endsOn, brusselsToday()),
        ),
      )
      .orderBy(asc(daysOff.startsOn));
    return {
      membershipId: me.id,
      weeklyHours: hours?.weeklyHours ?? null,
      daysOff: upcoming,
    };
  });
}
