import { describe, expect, it } from "vitest";
import {
  formatEuros,
  parseEuros,
  serviceFromForm,
  serviceInput,
} from "./schema";

const physio = "1b4e28ba-2fa1-4d3b-a3f5-ef19b5a7633b";

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of [value].flat()) data.append(key, v);
  }
  return serviceInput.safeParse(serviceFromForm(data));
}

describe("parseEuros", () => {
  it.each([
    ["45", 4500],
    ["45.5", 4550],
    ["45,50", 4550],
    ["€ 45.00", 4500],
    [" 0.50 ", 50],
  ])("reads %s as %i cents", (input, cents) => {
    expect(parseEuros(input)).toBe(cents);
  });

  it.each([
    "",
    "abc",
    "45.505",
    "-5",
    "45 €",
    "1.000,00",
  ])("refuses %s", (input) => {
    expect(parseEuros(input)).toBeNull();
  });
});

describe("formatEuros", () => {
  it("shows two decimals", () => {
    expect(formatEuros(4550)).toBe("€45.50");
    expect(formatEuros(6000)).toBe("€60.00");
  });
});

describe("serviceInput", () => {
  it("accepts a full service", () => {
    const parsed = form({
      name: "  Initial assessment ",
      durationMinutes: "45",
      price: "60",
      practitionerIds: [physio],
      active: "on",
    });
    expect(parsed.data).toEqual({
      name: "Initial assessment",
      durationMinutes: 45,
      priceCents: 6000,
      practitionerIds: [physio],
      active: true,
    });
  });

  it("keeps a service with no physio, hidden", () => {
    const parsed = form({
      name: "Massage",
      durationMinutes: "30",
      price: "40",
    });
    expect(parsed.data?.practitionerIds).toEqual([]);
    expect(parsed.data?.active).toBe(false);
  });

  it.each([
    ["7", "At least 10 minutes"],
    ["32", "Use steps of 5 minutes"],
    ["300", "4 hours max"],
    ["", "At least 10 minutes"],
  ])("refuses a length of %s minutes", (durationMinutes, message) => {
    const parsed = form({ name: "Massage", durationMinutes, price: "40" });
    expect(parsed.error?.issues[0]?.message).toBe(message);
  });

  it.each([
    ["0.20", "Card payments start at €0.50"],
    ["2000", "€1,000.00 max"],
    ["forty", "Enter a price like 45.00"],
  ])("refuses a price of %s", (price, message) => {
    const parsed = form({ name: "Massage", durationMinutes: "30", price });
    expect(parsed.error?.issues[0]?.message).toBe(message);
  });

  it("refuses a physio id that is not a uuid", () => {
    const parsed = form({
      name: "Massage",
      durationMinutes: "30",
      price: "40",
      practitionerIds: ["camille"],
    });
    expect(parsed.success).toBe(false);
  });
});
