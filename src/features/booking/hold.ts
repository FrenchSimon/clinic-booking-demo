import "server-only";
import { sql } from "drizzle-orm";
import { withRls } from "@/lib/db";
import {
  type BookingPage,
  getAvailability,
  type PublicService,
} from "./public";
import { slotTime } from "./selection";
import { freeSlots } from "./slots";
import { addDays, brusselsInstant } from "./time";

/**
 * The physio and start of a free slot at this day and time, checked again on
 * the server: the page may be minutes old. With "any", the first free physio.
 */
export async function findSlot(
  page: BookingPage,
  service: PublicService,
  choice: { physio: "any" | string; day: string; at: string },
): Promise<{ membershipId: string; startsAt: Date } | null> {
  const { schedules, busy } = await getAvailability(
    page.id,
    brusselsInstant(choice.day, "00:00"),
    brusselsInstant(addDays(choice.day, 1), "00:00"),
  );
  const slots = freeSlots({
    from: choice.day,
    days: 1,
    durationMinutes: service.durationMinutes,
    clinicHours: page.openingHours,
    physios: schedules.filter((s) =>
      service.physioIds.includes(s.membershipId),
    ),
    busy,
    now: new Date(),
  });
  const slot = slots.find(
    (s) =>
      slotTime(s) === choice.at &&
      (choice.physio === "any" || s.membershipId === choice.physio),
  );
  return slot ?? null;
}

/**
 * Holds the slot for 15 minutes through private.hold_slot() (drizzle/0014).
 * A slot taken meanwhile or a service no longer bookable is an expected
 * outcome, returned as the error the booking page shows.
 */
export async function holdSlot(
  userId: string,
  serviceId: string,
  membershipId: string,
  startsAt: Date,
): Promise<{ id: string } | { error: "taken" | "unavailable" }> {
  try {
    const rows = await withRls(userId, (tx) =>
      tx.execute<{ id: string }>(
        sql`select private.hold_slot(${serviceId}, ${membershipId}, ${startsAt.toISOString()}) as id`,
      ),
    );
    const id = rows[0]?.id;
    if (!id) throw new Error("Hold not created");
    return { id };
  } catch (error) {
    const reason = holdError(error);
    if (!reason) throw error;
    return { error: reason };
  }
}

function holdError(error: unknown): "taken" | "unavailable" | null {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current) {
      // 23P01: the exclusion constraint, someone held this slot first.
      if (current.code === "23P01") return "taken";
      if (current.code === "P0001") {
        return current.message === "slot_in_past" ? "taken" : "unavailable";
      }
    }
    current = current.cause;
  }
  return null;
}
