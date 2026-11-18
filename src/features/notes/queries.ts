import "server-only";
import { desc } from "drizzle-orm";
import { withRls } from "@/lib/db";
import { notes } from "./table";

export function listNotes(userId: string) {
  return withRls(userId, (tx) =>
    tx.select().from(notes).orderBy(desc(notes.createdAt)).limit(50),
  );
}
