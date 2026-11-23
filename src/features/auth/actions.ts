"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { listMyRoles } from "@/features/clinics/queries";
import { fill, type Locale } from "@/i18n/locale";
import { translateMessage } from "@/i18n/messages";
import { getRequestDictionary } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { siteOrigin } from "@/server/site-origin";
import { landingPath } from "./landing";
import {
  emailInput,
  logInInput,
  newPasswordInput,
  safeNext,
  signUpInput,
} from "./schema";

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
  values?: { email?: string };
};

/**
 * Resolves /start here instead of redirecting to it: a Server Action redirect
 * is a client-side navigation, and /start is a route handler, so the address
 * would stay on /start and the next action (log out) would post to it.
 */
async function destination(next: string, userId: string): Promise<string> {
  return next === "/start" ? landingPath(await listMyRoles(userId)) : next;
}

function fieldErrors(
  error: z.ZodError,
  locale: Locale,
): FormState["fieldErrors"] {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= translateMessage(
      issue.message,
      locale,
      (d) => d.auth.validation,
    );
  }
  return result;
}

export async function logIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getRequestDictionary();
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("auth:login", 5)))
    return { error: t.auth.errors.tooMany };

  const parsed = logInInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrors(parsed.error, locale),
      values: { email },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Same message whatever went wrong, so the form does not reveal which emails exist.
    const message =
      error.code === "email_not_confirmed"
        ? t.auth.errors.notConfirmed
        : t.auth.errors.wrongCredentials;
    return { error: message, values: { email } };
  }

  const next = safeNext(formData.get("next"), "/start");
  redirect(await destination(next, data.user.id));
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getRequestDictionary();
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("auth:signup", 5)))
    return { error: t.auth.errors.tooMany };

  const next = safeNext(formData.get("next"), "/start");
  const parsed = signUpInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrors(parsed.error, locale),
      values: { email },
    };
  }

  const supabase = await createClient();
  const { email: address, password } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email: address,
    password,
    options: {
      // Proof of when the terms were accepted, kept with the account.
      data: { terms_accepted_at: new Date().toISOString() },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return {
      error: t.auth.errors.signUpFailed,
      values: { email },
    };
  }

  // With email confirmation on, Supabase returns no session until the link is opened.
  if (!data.session || !data.user) {
    return {
      message: fill(t.auth.messages.confirmSent, {
        email: parsed.data.email,
      }),
    };
  }
  redirect(await destination(next, data.user.id));
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getRequestDictionary();
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("auth:reset", 3)))
    return { error: t.auth.errors.tooMany };

  const parsed = emailInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrors(parsed.error, locale),
      values: { email },
    };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  // Same answer whether or not the account exists.
  return {
    message: fill(t.auth.messages.resetSent, { email: parsed.data.email }),
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getRequestDictionary();
  // The reset link signs the user in with a short recovery session.
  await requireUser();

  const parsed = newPasswordInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { fieldErrors: fieldErrors(parsed.error, locale) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    const message =
      error.code === "same_password"
        ? t.auth.errors.samePassword
        : t.auth.errors.updateFailed;
    return { error: message };
  }
  redirect("/");
}
