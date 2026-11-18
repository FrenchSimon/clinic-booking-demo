import { expect, test } from "@playwright/test";

for (const [path, title] of [
  ["/terms", "Terms of use"],
  ["/privacy", "Privacy"],
] as const) {
  test(`${path} is reachable from the footer and fits a phone`, async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Legal" })
      .getByRole("link", { name: title.split(" ")[0] })
      .click();

    // The dev server compiles the page on its first visit, which can take
    // more than the default 5 seconds.
    await expect(page).toHaveURL(path, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
