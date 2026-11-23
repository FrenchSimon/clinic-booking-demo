import { describe, expect, it } from "vitest";
import { en } from "./en";
import { fr } from "./fr";
import { fill, toLocale } from "./locale";

/** "bar.roles.owner: string", one line per leaf, to compare the two shapes. */
function shape(value: unknown, path = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([k, v]) =>
      shape(v, path ? `${path}.${k}` : k),
    );
  }
  const kind = Array.isArray(value) ? `array(${value.length})` : typeof value;
  return [`${path}: ${kind}`];
}

/** Every "{name}" placeholder of each string leaf. */
function placeholders(value: unknown, path = ""): string[] {
  if (typeof value === "string") {
    const names = [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    return [`${path}: ${names.join(",")}`];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      placeholders(v, `${path}.${k}`),
    );
  }
  return [];
}

describe("dictionaries", () => {
  it("French has every English key, and no other", () => {
    expect(shape(fr)).toEqual(shape(en));
  });

  it("French keeps the placeholders of each English string", () => {
    expect(placeholders(fr)).toEqual(placeholders(en));
  });
});

describe("locale helpers", () => {
  it("reads only the two languages", () => {
    expect(toLocale("fr")).toBe("fr");
    expect(toLocale("en")).toBe("en");
    expect(toLocale("FR")).toBe("en");
    expect(toLocale(undefined)).toBe("en");
  });

  it("fills placeholders and leaves unknown ones", () => {
    expect(fill("{count} e-mails, {x}", { count: 3 })).toBe("3 e-mails, {x}");
  });
});
