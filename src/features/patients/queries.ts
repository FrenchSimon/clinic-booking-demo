import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { withRls } from "@/lib/db";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

// The owner's patient list, through private.clinic_patients() (drizzle/0016):
// patients have no name, only the email of their account, which row level
// security does not expose. Parsed with Zod, like the public booking page.

const patients = z.array(
  z.object({
    id: z.uuid(),
    email: z.string(),
    since: z.coerce.date(),
    pastSessions: z.number().int(),
    lastSession: z.coerce.date().nullable(),
    nextSession: z.coerce.date().nullable(),
  }),
);

export type ClinicPatient = z.infer<typeof patients>[number];

/**
 * The clinic's patients by email, with their paid sessions before and after
 * `at`. Runs inside a withRls() transaction: only the owner gets a list.
 */
export async function clinicPatients(
  tx: Tx,
  clinicId: string,
  at: Date,
): Promise<ClinicPatient[]> {
  const rows = await tx.execute<{ list: unknown }>(
    sql`select private.clinic_patients(${clinicId}, ${at.toISOString()}) as list`,
  );
  return patients.parse(rows[0]?.list);
}

/** The owner's patient list (checklist #16). */
export function getPatients(userId: string, clinicId: string, at = new Date()) {
  return withRls(userId, (tx) => clinicPatients(tx, clinicId, at));
}
