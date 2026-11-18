import { z } from "zod";

// Shared by the form (instant feedback) and the Server Action (the real check).
export const noteInput = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(500, "500 characters max"),
});

export type NoteInput = z.infer<typeof noteInput>;
