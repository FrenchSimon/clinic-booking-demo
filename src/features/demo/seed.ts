import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { practitionerHours } from "@/features/availability/table";
import { bookings } from "@/features/booking/table";
import { clinics, memberships } from "@/features/clinics/table";
import { servicePractitioners, services } from "@/features/services/table";
import type { adminDb } from "@/lib/db";
import {
  DEMO_CLINIC,
  DEMO_PATIENTS,
  DEMO_PHYSIOS,
  DEMO_SERVICES,
  type DemoBooking,
} from "./plan";

type Tx = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

export type SeededBooking = DemoBooking & {
  id: string;
  paymentIntentId: string | null;
};

/**
 * Accounts for the demo's physios and patients. Nobody can log in with them
 * (no password). app_metadata marks them, so cleanup.ts deletes them with
 * the visitor; users cannot write app_metadata. Empty tokens, not NULL:
 * Supabase Auth cannot read a user whose token columns are NULL. created_at
 * has no default: cleanup.ts needs it to know when the demo started.
 */
async function createDemoUsers(tx: Tx, emails: string[]): Promise<string[]> {
  const ids = emails.map(() => randomUUID());
  const rows = emails.map(
    (email, i) =>
      sql`(${ids[i]}, '00000000-0000-0000-0000-000000000000', 'authenticated',
        'authenticated', ${email}, '{"kinora_demo": true}', '{}', '', '', '', '',
        now(), now())`,
  );
  await tx.execute(sql`insert into auth.users (id, instance_id, aud, role,
    email, raw_app_meta_data, raw_user_meta_data, confirmation_token,
    recovery_token, email_change_token_new, email_change, created_at,
    updated_at)
    values ${sql.join(rows, sql`, `)}`);
  return ids;
}

/** Adds the team, their hours and the services they give. Returns the physios' membership ids. */
async function addTeam(tx: Tx, clinicId: string, domain: string) {
  const users = await createDemoUsers(
    tx,
    DEMO_PHYSIOS.map((p) => `${p.key}@${domain}`),
  );
  const physios = await tx
    .insert(memberships)
    .values(
      DEMO_PHYSIOS.map((p, i) => ({
        clinicId,
        userId: users[i] ?? "",
        role: "practitioner" as const,
        displayName: p.name,
      })),
    )
    .returning({ id: memberships.id });
  const physioIds = physios.map((p) => p.id);
  await tx.insert(practitionerHours).values(
    DEMO_PHYSIOS.map((p, i) => ({
      clinicId,
      membershipId: physioIds[i] ?? "",
      weeklyHours: p.hours,
    })),
  );
  return physioIds;
}

async function addServices(tx: Tx, clinicId: string, physioIds: string[]) {
  const rows = await tx
    .insert(services)
    .values(DEMO_SERVICES.map(({ physios: _, ...s }) => ({ clinicId, ...s })))
    .returning({ id: services.id });
  const serviceIds = rows.map((r) => r.id);
  await tx.insert(servicePractitioners).values(
    DEMO_SERVICES.flatMap((s, i) =>
      s.physios.map((p) => ({
        clinicId,
        serviceId: serviceIds[i] ?? "",
        membershipId: physioIds[p] ?? "",
      })),
    ),
  );
  return serviceIds;
}

async function addPatients(tx: Tx, clinicId: string, domain: string) {
  const users = await createDemoUsers(
    tx,
    DEMO_PATIENTS.map((p) => `${p}@${domain}`),
  );
  await tx
    .insert(memberships)
    .values(
      users.map((userId) => ({ clinicId, userId, role: "patient" as const })),
    );
  return users;
}

/**
 * Creates the visitor's demo clinic (checklist #19), with the visitor as its
 * owner through the trigger in drizzle/0003. Runs as the database owner:
 * bookings have no write policy, and the physios' accounts are not the
 * visitor's to create. Returns the clinic id.
 */
export async function seedDemoClinic(
  tx: Tx,
  visitorId: string,
  rows: SeededBooking[],
): Promise<string> {
  const id = randomBytes(4).toString("hex");
  const [clinic] = await tx
    .insert(clinics)
    .values({ ...DEMO_CLINIC, slug: `demo-${id}`, createdBy: visitorId })
    .returning({ id: clinics.id });
  if (!clinic) throw new Error("The demo clinic was not created");

  // A reserved domain: these addresses never reach anyone. Kept short, so
  // the address fits a phone screen.
  const domain = `${id}.example`;
  const physioIds = await addTeam(tx, clinic.id, domain);
  const serviceIds = await addServices(tx, clinic.id, physioIds);
  const patientIds = await addPatients(tx, clinic.id, domain);

  await tx.insert(bookings).values(
    rows.map((b) => ({
      id: b.id,
      clinicId: clinic.id,
      serviceId: serviceIds[b.service] ?? "",
      membershipId: physioIds[b.physio] ?? "",
      patientId: patientIds[b.patient] ?? "",
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      priceCents: b.priceCents,
      status: b.status,
      stripePaymentIntentId: b.paymentIntentId,
      paidAt: b.paidAt,
      cancelledAt: b.cancelledAt,
      createdAt: b.paidAt,
    })),
  );
  return clinic.id;
}
