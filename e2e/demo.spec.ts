import { expect, test } from "@playwright/test";

test("every page offers to try the demo", async ({ page }) => {
  for (const path of ["/", "/login"]) {
    await page.goto(path);
    const bar = page.getByRole("complementary", { name: "About this demo" });
    await expect(
      bar.getByRole("button", { name: "Try the demo" }),
    ).toBeVisible();
  }
});

// Checklist #19. Creates a real anonymous account, demo clinic and Stripe
// test payments, deleted after 24 hours: CI has no Supabase project.
test("Try the demo opens a filled clinic of one's own", async ({ page }) => {
  test.skip(Boolean(process.env.CI), "Needs a real Supabase project");
  test.setTimeout(60_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await page.waitForURL("**/clinic", { timeout: 30_000 });

  await expect(page.getByText("This demo clinic is yours alone")).toBeVisible();
  await expect(page.getByText("Maison Tilleul").first()).toBeVisible();
  await expect(page.getByText("Camille Peeters").first()).toBeVisible();

  // A second click opens the same clinic instead of a new one.
  const address = await page.getByText(/Booking page address/).textContent();
  await page.getByRole("button", { name: "Try the demo" }).click();
  await page.waitForURL("**/clinic");
  await expect(page.getByText(/Booking page address/)).toHaveText(
    address ?? "",
  );

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
});
