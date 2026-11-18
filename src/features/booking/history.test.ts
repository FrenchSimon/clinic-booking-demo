import { describe, expect, it } from "vitest";
import { splitBookings } from "./history";
import type { BookingStatus } from "./table";

const NOW = new Date("2026-11-24T10:00:00Z");

function row(
  id: string,
  startsAt: string,
  status: BookingStatus = "confirmed",
  holdExpiresAt: string | null = null,
) {
  const start = new Date(startsAt);
  return {
    id,
    status,
    startsAt: start,
    endsAt: new Date(start.getTime() + 30 * 60_000),
    holdExpiresAt: holdExpiresAt ? new Date(holdExpiresAt) : null,
  };
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe("splitBookings", () => {
  it("puts paid sessions to come in upcoming, soonest first", () => {
    const { upcoming, past } = splitBookings(
      [
        row("later", "2026-12-03T09:00:00Z"),
        row("soon", "2026-11-25T09:00:00Z"),
      ],
      NOW,
    );
    expect(ids(upcoming)).toEqual(["soon", "later"]);
    expect(past).toEqual([]);
  });

  it("puts sessions that are over in past, latest first", () => {
    const { upcoming, past } = splitBookings(
      [
        row("old", "2026-10-01T09:00:00Z"),
        row("recent", "2026-11-20T09:00:00Z"),
      ],
      NOW,
    );
    expect(upcoming).toEqual([]);
    expect(ids(past)).toEqual(["recent", "old"]);
  });

  it("keeps a session that is under way in upcoming until it ends", () => {
    const { upcoming } = splitBookings(
      [row("now", "2026-11-24T09:45:00Z")],
      NOW,
    );
    expect(ids(upcoming)).toEqual(["now"]);
  });

  it("puts cancelled and refunded sessions in past, even if they were to come", () => {
    const { upcoming, past } = splitBookings(
      [
        row("cancelled", "2026-12-01T09:00:00Z", "cancelled"),
        row("refunded", "2026-12-02T09:00:00Z", "refunded"),
      ],
      NOW,
    );
    expect(upcoming).toEqual([]);
    expect(ids(past)).toEqual(["refunded", "cancelled"]);
  });

  it("shows a hold that is still being paid as upcoming", () => {
    const { upcoming } = splitBookings(
      [
        row(
          "paying",
          "2026-12-01T09:00:00Z",
          "pending_payment",
          "2026-11-24T10:10:00Z",
        ),
      ],
      NOW,
    );
    expect(ids(upcoming)).toEqual(["paying"]);
  });

  it("leaves out holds that were never paid, marked expired or not", () => {
    const { upcoming, past } = splitBookings(
      [
        row("expired", "2026-12-01T09:00:00Z", "expired"),
        row(
          "lapsed",
          "2026-12-01T10:00:00Z",
          "pending_payment",
          "2026-11-24T09:59:00Z",
        ),
      ],
      NOW,
    );
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });
});
