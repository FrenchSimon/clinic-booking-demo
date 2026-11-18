import { z } from "zod";

// Shared by the form (instant feedback) and the Server Action (the real check).
export const inviteInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the physio's name")
    .max(60, "60 characters max"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
});

export type InviteInput = z.infer<typeof inviteInput>;

/** Tokens are 32 random bytes in base64url: 43 characters, nothing else. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
