import { describe, expect, it } from "vitest";
import { landingPath } from "./landing";

describe("landingPath", () => {
  it("sends an owner or a physio to their clinic", () => {
    expect(landingPath(["owner"])).toBe("/clinic");
    expect(landingPath(["practitioner"])).toBe("/clinic");
  });

  it("sends a patient to their bookings", () => {
    expect(landingPath(["patient"])).toBe("/bookings");
  });

  it("prefers the clinic for a physio who is also a patient elsewhere", () => {
    expect(landingPath(["patient", "practitioner"])).toBe("/clinic");
  });

  it("sends someone with no role yet to create a clinic", () => {
    expect(landingPath([])).toBe("/clinic/new");
  });
});
