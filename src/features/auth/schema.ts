import { z } from "zod";

// Shared by the forms (instant feedback) and the Server Actions (the real check).
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

// bcrypt, used by Supabase Auth, ignores anything after 72 bytes.
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer");

export const logInInput = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpInput = z.object({
  email,
  password,
  // An unchecked checkbox is not sent at all, so anything but "on" is a refusal.
  terms: z.literal("on", { error: "Accept the terms to create an account" }),
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
