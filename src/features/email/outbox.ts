import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { adminDb } from "@/lib/db";
import { env } from "@/lib/env";
import { type EmailContent, renderEmail } from "./layout";
import { sendWithResend } from "./resend";
import { type EmailKind, emails } from "./table";

type Inserter = Pick<typeof adminDb, "insert">;

/**
 * Where a patient's email goes when their account has no address: only an
 * anonymous demo visitor has none. The reserved .example domain makes the
 * database hold it for the Outbox instead of sending it (drizzle/0020).
 */
export const DEMO_VISITOR_EMAIL = "you@demo-visitor.example";

export type QueuedEmail = {
  clinicId: string;
  kind: EmailKind;
  /** Same key, same email: a second call queues nothing. */
  dedupeKey: string;
  to: string;
  content: EmailContent;
};

/**
 * Queues an email. Pass the transaction of the action that triggers it, so the
 * email exists if and only if that change was saved. Returns the new row id,
 * or null when this email was already queued.
 */
export async function queueEmail(
  db: Inserter,
  email: QueuedEmail,
): Promise<string | null> {
  const { html, text } = renderEmail(email.content);
  const [row] = await db
    .insert(emails)
    .values({
      clinicId: email.clinicId,
      kind: email.kind,
      dedupeKey: email.dedupeKey,
      toEmail: email.to,
      subject: email.content.heading,
      html,
      text,
    })
    .onConflictDoNothing({ target: emails.dedupeKey })
    .returning({ id: emails.id });
  return row?.id ?? null;
}

export type DeliveryResult = "sent" | "failed" | "not-pending" | "no-api-key";

/**
 * Sends one queued email. Safe to call twice, even at the same time: only the
 * caller that moves the row from "pending" to "sending" sends it.
 * adminDb: sending runs outside any user's session (after an action, in a job).
 */
export async function deliverEmail(id: string): Promise<DeliveryResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return "no-api-key";

  const [email] = await adminDb
    .update(emails)
    .set({ status: "sending", attempts: sql`${emails.attempts} + 1` })
    .where(and(eq(emails.id, id), eq(emails.status, "pending")))
    .returning();
  if (!email) return "not-pending";

  const result = await sendWithResend(
    {
      from: env.EMAIL_FROM,
      to: email.toEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    },
    { apiKey, idempotencyKey: email.id },
  );

  await adminDb
    .update(emails)
    .set(
      result.ok
        ? {
            status: "sent",
            sentAt: new Date(),
            providerId: result.id,
            lastError: null,
          }
        : { status: "failed", lastError: result.error.slice(0, 500) },
    )
    .where(eq(emails.id, email.id));
  return result.ok ? "sent" : "failed";
}
