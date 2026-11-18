// Two clinics with every role, for the isolation tests. Inserted as the
// database owner inside the test transaction, then rolled back.
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { clinics, memberships } from "@/features/clinics/table";
import { emails } from "@/features/email/table";
import { invitations } from "@/features/invitations/table";
import { one, type Tx } from "./test-support";

async function createUser(tx: Tx) {
  const id = randomUUID();
  await tx.execute(
    sql`insert into auth.users (id, email, aud, role)
        values (${id}, ${`${id}@test.kinora.invalid`}, 'authenticated', 'authenticated')`,
  );
  return id;
}

async function createClinic(tx: Tx, name: string) {
  const owner = await createUser(tx);
  const practitioner = await createUser(tx);
  const patient = await createUser(tx);
  const otherPatient = await createUser(tx);

  // The trigger in drizzle/0003 adds the owner membership.
  const clinic = one(
    await tx
      .insert(clinics)
      .values({
        name,
        slug: `test-${randomUUID()}`,
        address: "Rue Exemple 12, 1000 Brussels",
        openingHours: DEFAULT_OPENING_HOURS,
        createdBy: owner,
      })
      .returning({ id: clinics.id }),
  );

  await tx.insert(memberships).values([
    { clinicId: clinic.id, userId: practitioner, role: "practitioner" },
    { clinicId: clinic.id, userId: patient, role: "patient" },
    { clinicId: clinic.id, userId: otherPatient, role: "patient" },
  ]);

  await tx.insert(invitations).values({
    clinicId: clinic.id,
    name: "Camille",
    email: `invite-${randomUUID()}@test.kinora.invalid`,
    tokenHash: randomUUID(),
    invitedBy: owner,
  });

  await tx.insert(emails).values({
    clinicId: clinic.id,
    kind: "practitioner_invite",
    dedupeKey: `test-${randomUUID()}`,
    toEmail: "camille@test.kinora.invalid",
    subject: "Join the clinic",
    html: "<p>Join</p>",
    text: "Join",
  });

  return {
    id: clinic.id,
    owner,
    practitioner,
    patient,
    otherPatient,
  };
}

/** Clinic A and clinic B, plus a signed-in user who belongs to neither. */
export async function seedTwoClinics(tx: Tx) {
  const a = await createClinic(tx, "Clinic A");
  const b = await createClinic(tx, "Clinic B");
  const outsider = await createUser(tx);
  return { a, b, outsider };
}
