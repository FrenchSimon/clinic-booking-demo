import { describe, expect, it } from "vitest";
import { localeRoute } from "./routing";

const at = (path: string) => new URL(path, "https://kinora.test");

describe("localeRoute", () => {
  it("serves English without a cookie", () => {
    const route = localeRoute(at("/clinic?tab=1"), undefined);
    expect(route).toMatchObject({ kind: "rewrite", locale: "en" });
    if (route.kind === "rewrite")
      expect(route.to.pathname + route.to.search).toBe("/en/clinic?tab=1");
  });

  it("serves the language of the cookie, home page included", () => {
    const route = localeRoute(at("/"), "fr");
    expect(route).toMatchObject({ kind: "rewrite", locale: "fr" });
    if (route.kind === "rewrite") expect(route.to.pathname).toBe("/fr");
  });

  it("falls back to English for an unknown cookie", () => {
    expect(localeRoute(at("/login"), "de")).toMatchObject({ locale: "en" });
  });

  it("turns ?lang= into the choice and a clean address", () => {
    const route = localeRoute(at("/c/maison?service=x&lang=fr"), "en");
    expect(route).toMatchObject({ kind: "redirect", locale: "fr" });
    if (route.kind === "redirect")
      expect(route.to.pathname + route.to.search).toBe("/c/maison?service=x");
  });

  it("drops an unknown ?lang= without changing the choice", () => {
    expect(localeRoute(at("/?lang=nl"), "fr")).toMatchObject({
      kind: "redirect",
      locale: null,
    });
  });

  it("leaves route handlers alone", () => {
    for (const path of ["/api/stripe/webhook", "/auth/confirm", "/start"]) {
      expect(localeRoute(at(path), "fr")).toEqual({ kind: "pass" });
    }
  });
});
