"use server";

import { revalidatePath } from "next/cache";
import { withRls } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { noteInput } from "./schema";
import { notes } from "./table";

export type ActionResult = { ok: true } | { ok: false; error: string };

// The pattern for every Server Action: user, rate limit, Zod, then the database through RLS.
export async function createNote(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit(`notes:create:${user.id}`, 20))) {
    return {
      ok: false,
      error: "Too many notes in a minute. Try again shortly.",
    };
  }

  const parsed = noteInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid note",
    };
  }

  await withRls(user.id, (tx) =>
    tx.insert(notes).values({ userId: user.id, body: parsed.data.body }),
  );
  revalidatePath("/notes");
  return { ok: true };
}
