import { describe, expect, it } from "vitest";
import type { PublicService } from "./public";
import { readSelection, selectionHref, timesByDay } from "./selection";
import type { Slot } from "./slots";
import { brusselsInstant } from "./time";

const CAMILLE = "11111111-1111-4111-8111-111111111111";
const THOMAS = "22222222-2222-4222-8222-222222222222";
const service = (id: string, physioIds = [CAMILLE, THOMAS]): PublicService => ({
  id,
  name: "Follow-up",
  durationMinutes: 30,
  priceCents: 4500,
  physioIds,
});
const FOLLOW_UP = service("33333333-3333-4333-8333-333333333333");
const ASSESSMENT = service("44444444-4444-4444-8444-444444444444", [THOMAS]);

const slot = (membershipId: string, date: string, time: string): Slot => {
  const startsAt = brusselsInstant(date, time);
  return {
    membershipId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 30 * 60_000),
  };
};
const slots = [
  slot(CAMILLE, "2026-11-24", "09:00"),
  slot(THOMAS, "2026-11-24", "09:00"),
  slot(THOMAS, "2026-11-24", "09:30"),
  slot(CAMILLE, "2026-11-25", "23:45"),
];

describe("timesByDay", () => {
  it("merges physios for any, without repeating a time", () => {
    expect(Object.fromEntries(timesByDay(slots, "any"))).toEqual({
      "2026-11-24": ["09:00", "09:30"],
      "2026-11-25": ["23:45"],
    });
  });

  it("keeps one physio's times, on their Brussels day", () => {
    expect(Object.fromEntries(timesByDay(slots, CAMILLE))).toEqual({
      "2026-11-24": ["09:00"],
      "2026-11-25": ["23:45"],
    });
  });
});

describe("readSelection", () => {
  const read = (raw: Record<string, string>) =>
    readSelection(raw, [FOLLOW_UP, ASSESSMENT], () => slots);

  it("starts with the first service, any physio and the first free day", () => {
    const s = read({});
    expect([s.service?.id, s.physio, s.day, s.at]).toEqual([
      FOLLOW_UP.id,
      "any",
      "2026-11-24",
      null,
    ]);
  });

  it("keeps a valid choice", () => {
    const s = read({
      service: FOLLOW_UP.id,
      physio: THOMAS,
      day: "2026-11-24",
      at: "09:30",
    });
    expect([s.physio, s.day, s.at]).toEqual([THOMAS, "2026-11-24", "09:30"]);
  });

  it("drops what no longer works instead of failing", () => {
    // Camille does not give the assessment, 09:30 is not hers, the day is gone.
    expect(read({ service: ASSESSMENT.id, physio: CAMILLE }).physio).toBe(
      "any",
    );
    expect(read({ physio: CAMILLE, at: "09:30" }).at).toBeNull();
    expect(read({ day: "2026-12-25" }).day).toBe("2026-11-24");
    expect(read({ service: "nope", physio: "<script>" }).service?.id).toBe(
      FOLLOW_UP.id,
    );
  });

  it("has nothing to choose when the clinic has no service", () => {
    const s = readSelection({}, [], () => slots);
    expect([s.service, s.day]).toEqual([null, null]);
  });
});

describe("selectionHref", () => {
  const current = {
    service: FOLLOW_UP,
    physio: THOMAS,
    day: "2026-11-24",
    at: "09:30",
  };

  it("picks a time and keeps the rest", () => {
    expect(selectionHref("tilleul", current, { at: "09:00" })).toBe(
      `/c/tilleul?service=${FOLLOW_UP.id}&physio=${THOMAS}&day=2026-11-24&at=09%3A00`,
    );
  });

  it("clears the time on a new day or physio, and everything on a new service", () => {
    expect(
      selectionHref("tilleul", current, { day: "2026-11-25" }),
    ).not.toContain("at=");
    expect(selectionHref("tilleul", current, { physio: "any" })).toContain(
      "day=2026-11-24",
    );
    expect(selectionHref("tilleul", current, { service: ASSESSMENT.id })).toBe(
      `/c/tilleul?service=${ASSESSMENT.id}&physio=any`,
    );
  });
});
