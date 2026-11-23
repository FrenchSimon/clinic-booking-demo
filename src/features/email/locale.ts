import "server-only";
import type { User } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";
import { type Locale, toLocale } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/server";

// The language a patient's emails are written in. A booking's emails are
// queued where no visitor's cookie exists (Stripe's webhook, the reminder
// job, an owner cancelling), so the language the patient booked in is kept
// on their account: user_metadata.locale. No column, so no migration.

/**
 * The patient's language in a select that joins auth.users, as a raw value:
 * user_metadata is written by the user, so read it with patientLocale().
 */
export const storedLocale = sql<
  string | null
>`"auth"."users"."raw_user_meta_data"->>'locale'`;

/** The stored value as a language, English when missing or unknown. */
export function patientLocale(value: unknown): Locale {
  return toLocale(value);
}

/** Keeps the language the patient is booking in, when it changed. */
export async function rememberLocale(user: User, locale: Locale) {
  if (user.user_metadata?.locale === locale) return;
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { locale } });
}
