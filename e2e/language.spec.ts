import { expect, test } from "@playwright/test";

// R7.1: ?lang= sets the language and loads the clean address; the switch in
// the portfolio bar keeps the page and its query.
test("?lang=fr shows the page in French, the switch goes back to English", async ({
  page,
}) => {
  await page.goto("/login?next=%2Fbookings&lang=fr");
  await expect(page).toHaveURL("/login?next=%2Fbookings");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  const languages = page.getByRole("navigation", { name: "Langue" });
  await expect(languages.getByRole("link", { name: "FR" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(
    page.getByText("Démo de portfolio · cabinet fictif"),
  ).toBeVisible();

  // Before hydration the link still works, but drops the rest of the query.
  await page.waitForLoadState("networkidle");
  await languages.getByRole("link", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en", {
    timeout: 15_000,
  });
  await expect(page).toHaveURL("/login?next=%2Fbookings");
  await expect(
    page.getByText("Portfolio demo · fictional clinic"),
  ).toBeVisible();
});
