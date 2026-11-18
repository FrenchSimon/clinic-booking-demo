import { expect, type Page, test } from "@playwright/test";

// Checklist #22: every page works on a 375 px phone, the narrowest screen in
// DESIGN.md. Pixel 7 is 412 px wide, so this file narrows the viewport.
test.use({ viewport: { width: 375, height: 812 } });

async function expectNoSideScroll(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main").first()).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, `no horizontal scroll on ${path}`).toBeLessThanOrEqual(0);
}

test("public pages fit a 375 px screen", async ({ page }) => {
  for (const path of [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/terms",
    "/privacy",
  ]) {
    await expectNoSideScroll(page, path);
  }
});

// Creates a real demo clinic, deleted after 24 hours: CI has no Supabase project.
test("every signed-in page fits a 375 px screen", async ({ page }) => {
  test.skip(Boolean(process.env.CI), "Needs a real Supabase project");
  test.setTimeout(120_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await page.waitForURL("**/clinic", { timeout: 30_000 });

  const firstHref = async (from: string, pattern: RegExp) => {
    await page.goto(from);
    const hrefs = await page
      .locator("a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    const href = hrefs.find((h) => pattern.test(h));
    expect(href, `a link matching ${pattern} on ${from}`).toBeDefined();
    return href ?? "";
  };
  const bookingPage = await firstHref("/clinic", /^\/c\//);
  const ownerBooking = await firstHref(
    "/clinic/bookings",
    /^\/clinic\/bookings\/./,
  );
  const service = await firstHref(
    "/clinic/services",
    /^\/clinic\/services\/(?!new)./,
  );

  for (const path of [
    "/clinic",
    "/clinic/bookings",
    ownerBooking,
    "/clinic/patients",
    "/clinic/services",
    "/clinic/services/new",
    service,
    "/outbox",
    bookingPage,
  ]) {
    await expectNoSideScroll(page, path);
  }

  const viewAs = async (role: string) => {
    await page.goto("/clinic");
    await page.getByRole("button", { name: /View the demo as/ }).click();
    await page.getByRole("menuitemradio", { name: role }).click();
  };

  await viewAs("Practitioner");
  await expect(
    page.getByRole("link", { name: "My hours", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expectNoSideScroll(page, "/clinic/hours");

  await viewAs("Patient");
  await page.waitForURL("**/bookings");
  const patientBooking = await firstHref("/bookings", /^\/bookings\/./);
  for (const path of ["/bookings", patientBooking]) {
    await expectNoSideScroll(page, path);
  }
});
