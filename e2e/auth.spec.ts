import { expect, test } from "@playwright/test";

// These journeys never reach Supabase with real credentials: they cover what
// the app decides on its own (validation, redirects, error messages).

for (const path of ["/login", "/signup"]) {
  test(`${path} fits a phone screen`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("sign-up shows errors next to the fields", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.locator("#field-email-error")).toHaveText(
    "Enter a valid email address",
  );
  await expect(page.locator("#field-password-error")).toHaveText(
    "Use at least 8 characters",
  );
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("login ignores a redirect to another site", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/");
});

test("an invalid email link sends back to login with a message", async ({
  page,
}) => {
  await page.goto("/auth/confirm?token_hash=nope&type=recovery");
  await expect(page).toHaveURL(/\/login\?error=link/);
  await expect(page.getByRole("alert")).toContainText("invalid or has expired");
});
