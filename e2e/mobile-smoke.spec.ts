import { expect, test } from "@playwright/test";

test("home page fits a phone screen", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("every page shows the portfolio bar with the source code", async ({
  page,
}) => {
  for (const path of ["/", "/login"]) {
    await page.goto(path);
    const bar = page.getByRole("complementary", { name: "About this demo" });
    const link = bar.getByRole("link", { name: /Read the code/ });
    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/FrenchSimon/clinic-booking-demo",
    );
    await expect(link).toHaveAttribute("target", "_blank");
  }
});
