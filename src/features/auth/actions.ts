"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/server/rate-limit";
import { logInInput, safeNext, signUpInput } from "./schema";

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
  values?: { email?: string };
};

const TOO_MANY = "Too many attempts. Wait a minute and try again.";

function fieldErrors(error: z.ZodError): FormState["fieldErrors"] {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** The site's own origin, used to build the links sent by email. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function logIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("auth:login", 5))) return { error: TOO_MANY };

  const parsed = logInInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Same message whatever went wrong, so the form does not reveal which emails exist.
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first: open the link we sent you."
        : "Email or password is incorrect.";
    return { error: message, values: { email } };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  if (!(await rateLimit("auth:signup", 5))) return { error: TOO_MANY };

  const parsed = signUpInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: { email } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  });
  if (error) {
    return {
      error: "We could not create the account. Try again in a moment.",
      values: { email },
    };
  }

  // With email confirmation on, Supabase returns no session until the link is opened.
  if (!data.session) {
    return {
      message: `Almost there: we sent a confirmation link to ${parsed.data.email}.`,
    };
  }
  redirect("/");
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
