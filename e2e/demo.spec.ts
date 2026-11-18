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
  test.setTimeout(120_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await page.waitForURL("**/clinic", { timeout: 30_000 });

  await expect(page.getByText("This demo clinic is yours alone")).toBeVisible();
  // On a phone the clinic name is hidden in the header (DESIGN.md): it is
  // still the page's clinic.
  await expect(page.getByText("Maison Tilleul").first()).toBeAttached();
  await expect(page.getByText("Camille Peeters").first()).toBeVisible();

  // Checklist #20: the role menu takes the button's place and changes the
  // visitor's real role, then gives the owner's clinic back unchanged.
  const address = await page.getByText(/Booking page address/).textContent();
  const roleMenu = page.getByRole("button", { name: /View the demo as/ });
  await expect(roleMenu).toHaveText(/Owner/);
  const viewAs = async (role: string) => {
    await roleMenu.click();
    await page.getByRole("menuitemradio", { name: role }).click();
    // The bar shows the new role once the switch and the page refresh are
    // done, which can take a while when the dev server compiles a page.
    await expect(roleMenu).toHaveText(new RegExp(role), { timeout: 20_000 });
  };

  await viewAs("Practitioner");
  await expect(
    page.getByRole("link", { name: "My hours", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Patients", exact: true }),
  ).toHaveCount(0);

  await viewAs("Patient");
  await page.waitForURL("**/bookings");
  await expect(page.getByText("Refunded").first()).toBeVisible();

  await viewAs("Owner");
  await page.waitForURL("**/clinic");
  await expect(page.getByText(/Booking page address/)).toHaveText(
    address ?? "",
  );

  // Checklist #21: the Outbox shows the emails instead of sending them, and
  // the reminder job adds one reminder per booking, however often it runs.
  await page.getByRole("link", { name: /^Outbox/ }).click();
  await page.waitForURL("**/outbox");
  const send = page.getByRole("button", {
    name: "Send tomorrow's reminders now",
  });
  await send.click();
  await expect(
    page.getByText(/reminders? added below|No new reminder/),
  ).toBeVisible({ timeout: 15_000 });
  await send.click();
  await expect(page.getByText(/No new reminder/)).toBeVisible({
    timeout: 15_000,
  });

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
});
