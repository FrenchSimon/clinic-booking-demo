import { brusselsToday } from "@/features/availability/schema";
import type { BookingStatus } from "@/features/booking/table";
import { addDays, brusselsInstant, weekday } from "@/features/booking/time";
import type { OpeningHours } from "@/features/clinics/schema";

// What a visitor's demo clinic holds (checklist #19): the Maison Tilleul team,
// its services, six patients and two weeks of sessions around today, so every
// dashboard has something to show. Pure data: seed.ts writes it.

const weekdays = (from: string, to: string, saturday?: [string, string]) =>
  ({
    mon: { open: true, from, to },
    tue: { open: true, from, to },
    wed: { open: true, from, to },
    thu: { open: true, from, to },
    fri: { open: true, from, to },
    sat: saturday
      ? { open: true, from: saturday[0], to: saturday[1] }
      : { open: false },
    sun: { open: false },
  }) satisfies OpeningHours;

export const DEMO_CLINIC = {
  name: "Maison Tilleul",
  address: "Rue du Tilleul 14, 1050 Brussels",
  openingHours: weekdays("08:00", "19:00", ["09:00", "13:00"]),
};

export const DEMO_PHYSIOS = [
  {
    key: "camille",
    name: "Camille Peeters",
    hours: weekdays("08:00", "16:00", ["09:00", "13:00"]),
  },
  { key: "julien", name: "Julien Moreau", hours: weekdays("11:00", "19:00") },
  { key: "sofie", name: "Sofie Janssens", hours: weekdays("08:00", "18:00") },
] as const;

export const DEMO_SERVICES = [
  {
    name: "First consultation",
    durationMinutes: 45,
    priceCents: 6000,
    physios: [0, 1, 2],
  },
  {
    name: "Follow-up session",
    durationMinutes: 30,
    priceCents: 4500,
    physios: [0, 1, 2],
  },
  {
    name: "Sports rehabilitation",
    durationMinutes: 60,
    priceCents: 7000,
    physios: [1, 2],
  },
] as const;

export const DEMO_PATIENTS = [
  "lea.dubois",
  "thomas.claes",
  "nora.benali",
  "pieter.wouters",
  "ines.lambert",
  "marc.vermeulen",
] as const;

type Status = Extract<BookingStatus, "confirmed" | "refunded">;

// One session per line: working days from today (Monday to Friday, -1 is
// the last one before), Brussels time, then indexes into the lists above.
// biome-ignore format: reads as a table
const ROWS: [day: number, time: string, physio: number, service: number, patient: number, status: Status][] = [
  [-10, "09:00", 0, 0, 0, "confirmed"],
  [-8, "14:00", 1, 1, 1, "confirmed"],
  [-6, "10:00", 2, 2, 2, "refunded"],
  [-5, "11:00", 0, 1, 3, "confirmed"],
  [-3, "16:00", 1, 1, 4, "confirmed"],
  [-2, "09:30", 2, 0, 5, "refunded"],
  [-1, "12:00", 0, 1, 0, "confirmed"],
  [0, "09:00", 0, 1, 1, "confirmed"],
  [0, "11:30", 1, 0, 2, "confirmed"],
  [0, "15:00", 2, 2, 3, "confirmed"],
  [1, "10:00", 0, 1, 4, "confirmed"],
  [1, "17:00", 1, 1, 5, "confirmed"],
  [2, "08:30", 2, 0, 1, "confirmed"],
  [3, "12:00", 1, 2, 0, "refunded"],
  [4, "11:00", 0, 1, 2, "confirmed"],
  [6, "14:30", 2, 1, 3, "confirmed"],
];

/** The working day `n` working days from `today` (today itself if it is one). */
export function workingDay(today: string, n: number): string {
  const isWorking = (d: string) => weekday(d) !== "sat" && weekday(d) !== "sun";
  let day = today;
  while (!isWorking(day)) day = addDays(day, 1);
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0; ) {
    day = addDays(day, step);
    if (isWorking(day)) left -= 1;
  }
  return day;
}

export type DemoBooking = {
  physio: number;
  service: number;
  patient: number;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  status: Status;
  paidAt: Date;
  cancelledAt: Date | null;
};

const HOUR = 3_600_000;
const earlier = (a: Date, b: Date) => (a < b ? a : b);

/** The demo's sessions, placed around the Brussels day of `now`. */
export function demoBookings(now: Date): DemoBooking[] {
  const today = brusselsToday(now);
  return ROWS.map(([day, time, physio, serviceIndex, patient, status]) => {
    const service = DEMO_SERVICES[serviceIndex];
    if (!service) throw new Error(`No demo service ${serviceIndex}`);
    const startsAt = brusselsInstant(workingDay(today, day), time);
    // Paid a few days ahead, cancelled a day before: never in the future.
    const paidAt = earlier(new Date(startsAt.getTime() - 72 * HOUR), now);
    const cancelledAt =
      status === "refunded"
        ? earlier(new Date(startsAt.getTime() - 26 * HOUR), now)
        : null;
    return {
      physio,
      service: serviceIndex,
      patient,
      startsAt,
      endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
      priceCents: service.priceCents,
      status,
      paidAt: earlier(paidAt, cancelledAt ?? paidAt),
      cancelledAt,
    };
  });
}

/**
 * Whose place the visitor takes in "View as" (checklist #20), by the local
 * part of the seeded address. Camille works every day, Saturday included;
 * Nora has a session today, one to come that she can still cancel, and a
 * refunded one.
 */
export const DEMO_STAND_INS = {
  practitioner: DEMO_PHYSIOS[0].key,
  patient: DEMO_PATIENTS[2],
} as const;
