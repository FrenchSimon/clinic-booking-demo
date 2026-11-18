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

  // Checklist #20: "View as" takes the button's place and changes the
  // visitor's real role, then gives the owner's clinic back unchanged.
  const address = await page.getByText(/Booking page address/).textContent();
  const viewAs = page.getByRole("group", { name: "View as" });
  await expect(viewAs.getByRole("button", { name: "Owner" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await viewAs.getByRole("button", { name: "Practitioner" }).click();
  await expect(
    page.getByRole("link", { name: "My hours", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Patients", exact: true }),
  ).toHaveCount(0);

  await viewAs.getByRole("button", { name: "Patient" }).click();
  await page.waitForURL("**/bookings");
  await expect(page.getByText("Refunded").first()).toBeVisible();

  await viewAs.getByRole("button", { name: "Owner" }).click();
  await page.waitForURL("**/clinic");
  await expect(page.getByText(/Booking page address/)).toHaveText(
    address ?? "",
  );

  // Checklist #21: the Outbox shows the emails instead of sending them, and
  // the reminder job adds one reminder per booking, however often it runs.
  await page.getByRole("link", { name: "Outbox", exact: true }).click();
  await page.waitForURL("**/outbox");
  const send = page.getByRole("button", {
    name: "Send tomorrow's reminders now",
  });
  await send.click();
  await expect(
    page.getByText(/reminders? added below|No new reminder/),
  ).toBeVisible();
  await send.click();
  await expect(page.getByText(/No new reminder/)).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
});
