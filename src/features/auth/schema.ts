import { z } from "zod";
import { auth } from "@/i18n/en/auth";

const v = auth.validation;

// Shared by the forms (instant feedback) and the Server Actions (the real check).
const email = z.string().trim().toLowerCase().pipe(z.email(v.emailInvalid));

// bcrypt, used by Supabase Auth, ignores anything after 72 bytes.
const password = z.string().min(8, v.passwordShort).max(72, v.passwordLong);

export const logInInput = z.object({
  email,
  password: z.string().min(1, v.passwordMissing),
});

export const signUpInput = z.object({
  email,
  password,
  // An unchecked checkbox is not sent at all, so anything but "on" is a refusal.
  terms: z.literal("on", { error: v.termsRequired }),
});

export const emailInput = z.object({ email });

export const newPasswordInput = z.object({ password });

export type LogInInput = z.infer<typeof logInInput>;
export type SignUpInput = z.infer<typeof signUpInput>;

/**
 * Where to send the user after an auth step. Only paths on this site are allowed,
 * so a crafted link like /login?next=https://evil.example cannot redirect elsewhere.
 */
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
