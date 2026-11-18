import { z } from "zod";
import { brusselsToday } from "@/features/availability/schema";
import type { PublicService } from "./public";
import type { Slot } from "./slots";

// The booking page keeps the patient's choices in the address, so every
// step is a plain link and a choice survives a reload or a shared link.

export const BOOKING_DAYS = 14;

const params = z.object({
  service: z.uuid().optional().catch(undefined),
  physio: z.union([z.literal("any"), z.uuid()]).catch("any"),
  day: z.iso.date().optional().catch(undefined),
  at: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .catch(undefined),
});

export type Selection = {
  service: PublicService | null;
  physio: "any" | string;
  day: string | null;
  at: string | null;
};

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Brussels",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "09:30", the Brussels time a slot starts. */
export function slotTime(slot: Slot): string {
  return timeFormat.format(slot.startsAt);
}

/** The start times per Brussels day, for one physio or any of them. */
export function timesByDay(
  slots: Slot[],
  physio: "any" | string,
): Map<string, string[]> {
  const days = new Map<string, string[]>();
  for (const slot of slots) {
    if (physio !== "any" && slot.membershipId !== physio) continue;
    const day = brusselsToday(slot.startsAt);
    const times = days.get(day) ?? [];
    const time = slotTime(slot);
    if (!times.includes(time)) times.push(time);
    days.set(day, times);
  }
  return days;
}

/**
 * Reads the address. A missing or stale choice falls back to the first one
 * that works: the first service, any physio, the first day with a free slot.
 */
export function readSelection(
  raw: Record<string, string | string[] | undefined>,
  services: PublicService[],
  physioSlots: (service: PublicService) => Slot[],
): Selection & { times: Map<string, string[]> } {
  const p = params.parse({
    service: one(raw.service),
    physio: one(raw.physio),
    day: one(raw.day),
    at: one(raw.at),
  });
  const service =
    services.find((s) => s.id === p.service) ?? services[0] ?? null;
  if (!service)
    return { service, physio: "any", day: null, at: null, times: new Map() };
  const physio =
    p.physio !== "any" && service.physioIds.includes(p.physio)
      ? p.physio
      : "any";
  const times = timesByDay(physioSlots(service), physio);
  const day =
    p.day && times.has(p.day) ? p.day : ([...times.keys()][0] ?? null);
  const at = day && p.at && times.get(day)?.includes(p.at) ? p.at : null;
  return { service, physio, day, at, times };
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The address after a change. A new service or physio clears the time; a new service also the day. */
export function selectionHref(
  slug: string,
  current: Selection,
  change: Partial<Record<"service" | "physio" | "day" | "at", string>>,
): string {
  const next = {
    service: change.service ?? current.service?.id,
    physio: change.physio ?? (change.service ? "any" : current.physio),
    day:
      change.day ?? (change.service ? undefined : (current.day ?? undefined)),
    at:
      change.at ??
      (change.service || change.physio || change.day
        ? undefined
        : (current.at ?? undefined)),
  };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) query.set(key, value);
  }
  return `/c/${slug}?${query}`;
}
