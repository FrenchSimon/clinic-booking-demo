import { describe, expect, it, vi } from "vitest";
import { answer, checkedReply } from "./conversation";
import type { Completion } from "./groq";
import type { NextSlotResult } from "./next-slot";

const slot = {
  day: "2026-11-25",
  when: "Wednesday, 25 November 2026 at 08:00",
  time: "08:00",
  physio: "Inès Dubois",
  service: "Initial assessment",
  href: "/c/maison-tilleul?service=x",
};

const toolCall = (args: string): Completion => ({
  content: "",
  toolCalls: [
    {
      id: "call_1",
      type: "function",
      function: { name: "next_free_slot", arguments: args },
    },
  ],
});
const text = (content: string): Completion => ({ content, toolCalls: [] });
const turns = [{ role: "user" as const, content: "Next free slot?" }];

describe("answer", () => {
  it("returns the slot the app computed, not one from the model", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCall('{"service":"Initial assessment"}'))
      .mockResolvedValueOnce(text("Wednesday 25 at 08:00 with Inès."));
    const findSlot = vi
      .fn()
      .mockResolvedValue({ found: true, slot } satisfies NextSlotResult);

    const result = await answer({ facts: "", turns, complete, findSlot });

    expect(findSlot).toHaveBeenCalledWith({ service: "Initial assessment" });
    expect(result).toEqual({ reply: "Wednesday 25 at 08:00 with Inès.", slot });
    const toolMessage = complete.mock.calls[1]?.[0].at(-1);
    expect(toolMessage).toMatchObject({ role: "tool", tool_call_id: "call_1" });
  });

  it("answers without a slot card when the tool is not called", async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(text("We are closed on Sunday."));
    const findSlot = vi.fn();
    const result = await answer({ facts: "", turns, complete, findSlot });
    expect(result).toEqual({ reply: "We are closed on Sunday.", slot: null });
    expect(findSlot).not.toHaveBeenCalled();
  });

  it("shows the card of the last search, not of an earlier one", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCall('{"service":"Initial assessment"}'))
      .mockResolvedValueOnce(toolCall('{"service":"Initial assessment"}'))
      .mockResolvedValueOnce(text("Nothing on Saturday."));
    const findSlot = vi
      .fn()
      .mockResolvedValueOnce({ found: true, slot })
      .mockResolvedValueOnce({ found: false, reason: "No free slot." });
    const result = await answer({ facts: "", turns, complete, findSlot });
    expect(result.slot).toBeNull();
  });

  it("does not run the tool with arguments that fail the schema", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce(toolCall("not json"))
      .mockResolvedValueOnce(text("Which session?"));
    const findSlot = vi.fn();
    const result = await answer({ facts: "", turns, complete, findSlot });
    expect(findSlot).not.toHaveBeenCalled();
    expect(result.slot).toBeNull();
  });

  it("stops after three model turns and offers no tool on the last one", async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(toolCall('{"service":"Initial assessment"}'));
    const findSlot = vi.fn().mockResolvedValue({ found: false, reason: "" });
    await expect(
      answer({ facts: "", turns, complete, findSlot }),
    ).rejects.toThrow();
    expect(complete).toHaveBeenCalledTimes(3);
    expect(complete.mock.calls[2]?.[1]).toEqual([]);
  });

  it("puts the rules and the clinic facts in the system prompt", async () => {
    const complete = vi.fn().mockResolvedValue(text("Hello"));
    await answer({
      facts: "Clinic: Maison Tilleul",
      turns,
      complete,
      findSlot: vi.fn(),
    });
    const system = complete.mock.calls[0]?.[0][0];
    expect(system.role).toBe("system");
    expect(system.content).toContain("Never give medical advice");
    expect(system.content).toContain("Clinic: Maison Tilleul");
  });
});

describe("checkedReply", () => {
  const facts = "- Saturday: 09:00 to 13:00";

  it("keeps a reply that gives the app's slot", () => {
    const reply = "Wednesday 25 November at 8:00 with Inès.";
    expect(checkedReply(reply, slot, facts)).toBe(reply);
    const french = "Mercredi 25 novembre à 08h00 avec Inès.";
    expect(checkedReply(french, slot, facts)).toBe(french);
  });

  it("keeps the opening hours when no slot is involved", () => {
    const reply = "On Saturday we open at 09:00.";
    expect(checkedReply(reply, null, facts)).toBe(reply);
  });

  it("replaces a reply with the slot's time on another day", () => {
    expect(
      checkedReply("Saturday 23 November at 08:00.", slot, facts),
    ).toContain("Wednesday, 25 November 2026 at 08:00");
  });

  it("replaces a reply that names a time the app never computed", () => {
    expect(
      checkedReply("Saturday 25 November at 09:00 with Sofie.", slot, facts),
    ).toBe(
      "The next free slot I found is Wednesday, 25 November 2026 at 08:00, with Inès Dubois.",
    );
    expect(checkedReply("€12.50, or try 14h30.", null, facts)).toContain(
      "booking page below",
    );
  });
});

it("does not take a price for a time", () => {
  const reply = "A session costs €12.50.";
  expect(checkedReply(reply, null, "")).toBe(reply);
});
