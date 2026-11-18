import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** The hash stored in the database, the same as private.accept_invitation() computes. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** A new secret for the email link, and the hash the database keeps. */
export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}
