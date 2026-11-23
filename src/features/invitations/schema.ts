import { z } from "zod";
import { team } from "@/i18n/en/team";

const v = team.inviteValidation;

// Shared by the form (instant feedback) and the Server Action (the real check).
export const inviteInput = z.object({
  name: z.string().trim().min(2, v.nameMissing).max(60, v.nameTooLong),
  email: z.string().trim().toLowerCase().pipe(z.email(v.emailInvalid)),
});

export type InviteInput = z.infer<typeof inviteInput>;

/** Tokens are 32 random bytes in base64url: 43 characters, nothing else. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
