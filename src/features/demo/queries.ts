import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import {
  clinics,
  type MembershipRole,
  memberships,
} from "@/features/clinics/table";
import { emails } from "@/features/email/table";
import { withRls } from "@/lib/db";

export type DemoClinic = {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
};

/**
 * The demo clinic the visitor started, with their role in it, or null when
 * they have none. Found by its creator, not by the owner's role: after
 * "View as" the visitor may be a practitioner or a patient there. Read
 * through RLS.
 */
export async function getDemoClinic(
  visitorId: string,
): Promise<DemoClinic | null> {
  const rows = await withRls(visitorId, (tx) =>
    tx
      .select({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        role: memberships.role,
      })
      .from(clinics)
      .innerJoin(
        memberships,
        and(
          eq(memberships.clinicId, clinics.id),
          eq(memberships.userId, visitorId),
        ),
      )
      .where(eq(clinics.createdBy, visitorId)),
  );
  return rows[0] ?? null;
}

/** The visitor's role in their demo clinic, or null when they have none. */
export async function getDemoRole(
  visitorId: string,
): Promise<MembershipRole | null> {
  return (await getDemoClinic(visitorId))?.role ?? null;
}

const OUTBOX_SIZE = 50;

/**
 * The demo clinic's Outbox (checklist #21): the emails Kinora would have
 * sent, newest first. Read through RLS: the visitor reads them in every
 * role (drizzle/0020). Only the plain text, never the stored HTML.
 */
export async function getOutbox(visitorId: string, clinicId: string) {
  return withRls(visitorId, (tx) =>
    tx
      .select({
        id: emails.id,
        kind: emails.kind,
        to: emails.toEmail,
        subject: emails.subject,
        text: emails.text,
        createdAt: emails.createdAt,
      })
      .from(emails)
      .where(eq(emails.clinicId, clinicId))
      .orderBy(desc(emails.createdAt), desc(emails.id))
      .limit(OUTBOX_SIZE),
  );
}

/** How many emails the demo clinic's Outbox holds, for the badge in the bar. */
export async function countOutbox(
  visitorId: string,
  clinicId: string,
): Promise<number> {
  const [row] = await withRls(visitorId, (tx) =>
    tx.select({ n: count() }).from(emails).where(eq(emails.clinicId, clinicId)),
  );
  return row?.n ?? 0;
}

export type OutboxEmail = Awaited<ReturnType<typeof getOutbox>>[number];
