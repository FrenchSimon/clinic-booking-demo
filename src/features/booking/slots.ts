import type { OpeningHours } from "@/features/clinics/schema";
import {
  addDays,
  brusselsInstant,
  fromMinutes,
  toMinutes,
  weekday,
} from "./time";

// Free slots, from data the caller has already read: no database here, so
// the rules are unit tested and the booking page, the assistant (R5.4) and
// the hold (R2.6) all use the same calculation.

/** Start times sit on this grid: 09:00, 09:15, 09:30… */
export const SLOT_STEP_MINUTES = 15;

export type PhysioSchedule = {
  membershipId: string;
  /** Null until the physio saves their hours: never bookable. */
  weeklyHours: OpeningHours | null;
  /** Calendar days, both ends included. */
  daysOff: { startsOn: string; endsOn: string }[];
};

/** A booking or a hold that takes the physio's time. */
export type Busy = { membershipId: string; startsAt: Date; endsAt: Date };

export type Slot = { membershipId: string; startsAt: Date; endsAt: Date };

export type SlotQuery = {
  /** First calendar day to search, in Brussels. */
  from: string;
  days: number;
  durationMinutes: number;
  clinicHours: OpeningHours;
  /** The physios who offer the service. */
  physios: PhysioSchedule[];
  busy: Busy[];
  /** Slots that start before this instant are gone. */
  now: Date;
};

/** Every free slot of every physio, sorted by start time, then by physio. */
export function freeSlots(query: SlotQuery): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < query.days; i++) {
    const date = addDays(query.from, i);
    for (const physio of query.physios) {
      slots.push(...physioSlots(query, physio, date));
    }
  }
  return slots.sort(
    (a, b) =>
      a.startsAt.getTime() - b.startsAt.getTime() ||
      a.membershipId.localeCompare(b.membershipId),
  );
}

function physioSlots(
  query: SlotQuery,
  physio: PhysioSchedule,
  date: string,
): Slot[] {
  const window = workingWindow(query.clinicHours, physio, date);
  if (!window) return [];
  const busy = query.busy.filter((b) => b.membershipId === physio.membershipId);
  const slots: Slot[] = [];
  const first = Math.ceil(window.from / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
  for (
    let start = first;
    start + query.durationMinutes <= window.to;
    start += SLOT_STEP_MINUTES
  ) {
    const startsAt = brusselsInstant(date, fromMinutes(start));
    const endsAt = new Date(
      startsAt.getTime() + query.durationMinutes * 60_000,
    );
    if (startsAt < query.now) continue;
    if (busy.some((b) => b.startsAt < endsAt && startsAt < b.endsAt)) continue;
    slots.push({ membershipId: physio.membershipId, startsAt, endsAt });
  }
  return slots;
}

/** Minutes after midnight when both the clinic is open and the physio works, or null. */
function workingWindow(
  clinicHours: OpeningHours,
  physio: PhysioSchedule,
  date: string,
): { from: number; to: number } | null {
  if (!physio.weeklyHours) return null;
  if (physio.daysOff.some((d) => d.startsOn <= date && date <= d.endsOn)) {
    return null;
  }
  const day = weekday(date);
  const clinic = clinicHours[day];
  const mine = physio.weeklyHours[day];
  if (!clinic.open || !mine.open) return null;
  const from = Math.max(toMinutes(clinic.from), toMinutes(mine.from));
  const to = Math.min(toMinutes(clinic.to), toMinutes(mine.to));
  return from < to ? { from, to } : null;
}
