import { describe, expect, it } from "vitest";
import type { BookingStatus } from "@/features/booking/table";
import { groupAgenda } from "./agenda";

const NOW = new Date("2026-11-18T10:00:00Z");

function row(
  startsAt: string,
  status: BookingStatus = "confirmed",
  holdExpiresAt: string | null = null,
) {
  const start = new Date(startsAt);
  return {
    id: startsAt,
    status,
    startsAt: start,
    endsAt: new Date(start.getTime() + 30 * 60_000),
    holdExpiresAt: holdExpiresAt ? new Date(holdExpiresAt) : null,
  };
}

describe("groupAgenda", () => {
  it("puts today's sessions first, then the other days that have one", () => {
    const { today, week } = groupAgenda(
      [
        row("2026-11-20T09:00:00Z"),
        row("2026-11-18T13:00:00Z"),
        row("2026-11-16T08:00:00Z", "cancelled"),
        row("2026-11-18T08:00:00Z"),
      ],
      "2026-11-18",
      "2026-11-16",
      NOW,
    );
    expect(today.map((r) => r.id)).toEqual([
      "2026-11-18T08:00:00Z",
      "2026-11-18T13:00:00Z",
    ]);
    expect(week.map((d) => d.date)).toEqual(["2026-11-16", "2026-11-20"]);
  });

  it("files a session by its Brussels day, not its UTC day", () => {
    // 00:30 in Brussels on Thursday is still Wednesday in UTC.
    const { today, week } = groupAgenda(
      [row("2026-11-18T23:30:00Z")],
      "2026-11-18",
      "2026-11-16",
      NOW,
    );
    expect(today).toEqual([]);
    expect(week[0]?.date).toBe("2026-11-19");
  });

  it("leaves out expired holds and holds whose 15 minutes are over", () => {
    const { today } = groupAgenda(
      [
        row("2026-11-18T14:00:00Z", "expired"),
        row("2026-11-18T15:00:00Z", "pending_payment", "2026-11-18T09:50:00Z"),
        row("2026-11-18T16:00:00Z", "pending_payment", "2026-11-18T10:10:00Z"),
      ],
      "2026-11-18",
      "2026-11-16",
      NOW,
    );
    expect(today.map((r) => r.status)).toEqual(["pending_payment"]);
  });
});
