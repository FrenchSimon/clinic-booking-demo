"use server";

import { z } from "zod";
import { brusselsToday } from "@/features/availability/schema";
import { getAvailability, getBookingPage } from "@/features/booking/public";
import { BOOKING_DAYS } from "@/features/booking/selection";
import { addDays, brusselsInstant } from "@/features/booking/time";
import { SLUG_PATTERN } from "@/features/clinics/schema";
import { getRequestLocale } from "@/i18n/server";
import { adminDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { type Answer, answer } from "./conversation";
import { clinicFacts } from "./facts";
import { complete, groqConfigured } from "./groq";
import { nextFreeSlot } from "./next-slot";
import { takeQuestion, visitorKey } from "./quota";

/** Questions kept as context: older ones are dropped, which keeps tokens low. */
const HISTORY = 8;

const input = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  turns: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(500),
      }),
    )
    .min(1)
    .max(40)
    .refine((t) => t.at(-1)?.role === "user"),
});

/** "limit": the visitor asked their 15 questions today (checklist #18). */
export type AssistantResult = Answer | { error: "resting" | "limit" };

/**
 * A patient's question on the public booking page. Open to visitors without
 * an account, like the page itself, so there is no requireUser(): it reads
 * only what the page shows, through withAnon(), is rate limited, and
 * counts every question against the visitor's daily quota before calling Groq.
 */
export async function askAssistant(raw: unknown): Promise<AssistantResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { error: "resting" };
  if (!groqConfigured()) return { error: "resting" };
  if (!(await rateLimit("assistant", 10))) return { error: "resting" };

  const page = await getBookingPage(parsed.data.slug);
  if (!page) return { error: "resting" };
  const now = new Date();
  const today = brusselsToday(now);
  // adminDb: the visitor has no account, so no RLS role can own the count.
  const visitor = visitorKey(await clientIp(), today);
  if (!(await takeQuestion(adminDb, visitor, today))) return { error: "limit" };

  // The page's language, from the same cookie: the reply and the slot's date use it.
  const locale = await getRequestLocale();
  try {
    return await answer({
      facts: clinicFacts(page, today, locale),
      locale,
      turns: parsed.data.turns.slice(-HISTORY),
      complete,
      findSlot: async (args) => {
        const availability = await getAvailability(
          page.id,
          brusselsInstant(today, "00:00"),
          brusselsInstant(addDays(today, BOOKING_DAYS), "00:00"),
        );
        return nextFreeSlot(page, availability, args, now, locale);
      },
    });
  } catch {
    return { error: "resting" };
  }
}
