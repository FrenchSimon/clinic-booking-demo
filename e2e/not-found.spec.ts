import { expect, test } from "@playwright/test";

// An unknown address answers 404 before anything renders. An unknown clinic
// is found out inside the streamed booking page (cacheComponents), after
// the 200 has gone out: Next.js then adds a noindex tag instead.
for (const [path, title, status] of [
  ["/no-such-page", "This page does not exist", 404],
  ["/c/no-such-clinic", "No clinic books at this address", 200],
] as const) {
  test(`${path} shows the not-found page with a way back home`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    // The dev server compiles the page on its first visit.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title, {
      timeout: 15_000,
    });
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    await page
      .getByRole("main")
      .getByRole("link", { name: "Go to the home page" })
      .click();
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  });
}
