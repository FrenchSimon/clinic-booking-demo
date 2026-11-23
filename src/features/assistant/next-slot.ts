import { z } from "zod";
import { brusselsToday } from "@/features/availability/schema";
import type { BookingPage } from "@/features/booking/public";
import {
  BOOKING_DAYS,
  selectionHref,
  slotTime,
} from "@/features/booking/selection";
import {
  type Busy,
  freeSlots,
  type PhysioSchedule,
} from "@/features/booking/slots";
import { addDays } from "@/features/booking/time";
import { dictionaries } from "@/i18n/dictionaries";
import { fill, type Locale } from "@/i18n/locale";
import { longDate } from "./facts";

// The assistant's only tool: the next free slot, from the same freeSlots()
// as the booking page (R2.3). The model picks the arguments, the app
// computes the answer, so a time the assistant announces is never made up.

export const NEXT_SLOT_TOOL = {
  type: "function",
  function: {
    name: "next_free_slot",
    description:
      "Finds the first free slot for a session at the clinic, within the next 14 days. Always call it before giving a date or time.",
    parameters: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description:
            "The session name, exactly as listed in the clinic facts.",
        },
        physio: {
          type: "string",
          description: "A physio's name, only if the patient asked for one.",
        },
        from: {
          type: "string",
          description:
            "First day to search, YYYY-MM-DD, from the clinic facts' list of next days. Set it whenever the patient names a day. Omit to start today.",
        },
      },
      required: ["service"],
    },
  },
} as const;

export const nextSlotArgs = z.object({
  service: z.string().max(100),
  physio: z.string().max(100).optional(),
  from: z.iso.date().optional(),
});

export type NextSlotArgs = z.infer<typeof nextSlotArgs>;

/** A slot the patient can open, prefilled, on the booking page. */
export type ProposedSlot = {
  day: string;
  /** "Monday, 23 November 2026 at 11:00", in the visitor's language: the model repeats it, so it never names the wrong weekday. */
  when: string;
  time: string;
  physio: string;
  service: string;
  href: string;
};

export type NextSlotResult =
  | { found: true; slot: ProposedSlot }
  | { found: false; reason: string };

const norm = (s: string) => s.trim().toLowerCase();

/** Pure: the caller reads the schedules and busy times for the next 14 days. */
export function nextFreeSlot(
  page: BookingPage,
  availability: { schedules: PhysioSchedule[]; busy: Busy[] },
  args: NextSlotArgs,
  now: Date,
  locale: Locale = "en",
): NextSlotResult {
  const service = page.services.find(
    (s) => norm(s.name) === norm(args.service),
  );
  if (!service) return { found: false, reason: "No session has this name." };
  const physio = args.physio
    ? page.physios.find(
        (p) =>
          service.physioIds.includes(p.id) &&
          norm(p.name).includes(norm(args.physio ?? "")),
      )
    : undefined;
  if (args.physio && !physio) {
    return {
      found: false,
      reason: "No physio with this name offers this session.",
    };
  }

  const today = brusselsToday(now);
  const last = addDays(today, BOOKING_DAYS - 1);
  const from = args.from && args.from > today ? args.from : today;
  if (from > last) {
    return { found: false, reason: "Online booking only opens 14 days ahead." };
  }
  const slots = freeSlots({
    from: today,
    days: BOOKING_DAYS,
    durationMinutes: service.durationMinutes,
    clinicHours: page.openingHours,
    physios: availability.schedules.filter((s) =>
      (physio ? [physio.id] : service.physioIds).includes(s.membershipId),
    ),
    busy: availability.busy,
    now,
  });
  const slot = slots.find((s) => brusselsToday(s.startsAt) >= from);
  if (!slot) {
    return { found: false, reason: "No free slot in the next 14 days." };
  }

  const day = brusselsToday(slot.startsAt);
  const time = slotTime(slot);
  const href = selectionHref(
    page.slug,
    { service, physio: "any", day: null, at: null },
    { service: service.id, physio: slot.membershipId, day, at: time },
  );
  const name = page.physios.find((p) => p.id === slot.membershipId)?.name ?? "";
  return {
    found: true,
    slot: {
      day,
      when: fill(dictionaries[locale].assistant.when, {
        date: longDate(day, locale),
        time,
      }),
      time,
      physio: name,
      service: service.name,
      href,
    },
  };
}
