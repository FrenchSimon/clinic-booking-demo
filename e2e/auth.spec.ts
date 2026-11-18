import { expect, test } from "@playwright/test";

// These journeys never reach Supabase with real credentials: they cover what
// the app decides on its own (validation, redirects, error messages).

for (const path of ["/login", "/signup", "/forgot-password"]) {
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
  await expect(page.locator("#field-terms-error")).toHaveText(
    "Accept the terms to create an account",
  );
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("login ignores a redirect to another site", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/start");
});

test("an invalid email link sends back to login with a message", async ({
  page,
}) => {
  await page.goto("/auth/confirm?token_hash=nope&type=recovery");
  await expect(page).toHaveURL(/\/login\?error=link/);
  // Next.js adds its own empty role="alert" route announcer, so match the text.
  await expect(page.getByText(/invalid or has expired/)).toBeVisible();
});

test("forgot password checks the email before sending anything", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email").fill("nope");
  await page.getByRole("button", { name: "Send the link" }).click();
  await expect(page.locator("#field-email-error")).toHaveText(
    "Enter a valid email address",
  );
});

test("the new password page needs the session from the email link", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await expect(page).toHaveURL(/\/login\?next=%2Freset-password/);
});

test("the clinic space needs a signed-in user", async ({ page }) => {
  for (const path of ["/clinic", "/clinic/new"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=%2Fclinic/);
  }
});

test("the landing page after login needs a signed-in user", async ({
  page,
}) => {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/login\?next=%2Fstart/);
});

test("an invitation link asks a visitor to sign up or log in", async ({
  page,
}) => {
  const token = "A".repeat(43);
  await page.goto(`/invite/${token}`);
  await expect(
    page.getByRole("heading", { name: "You're invited" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create my account" }),
  ).toHaveAttribute(
    "href",
    `/signup?next=${encodeURIComponent(`/invite/${token}`)}`,
  );
  await page.getByRole("link", { name: "Create my account" }).click();
  await expect(page.locator('input[name="next"]')).toHaveValue(
    `/invite/${token}`,
  );
});

test("a malformed invitation link shows the not-found page", async ({
  page,
}) => {
  // The page streams, so the status is already sent: the 404 is the page.
  await page.goto("/invite/not-a-token");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page does not exist",
    { timeout: 15_000 },
  );
  await expect(page.getByRole("button", { name: /Join/ })).toHaveCount(0);
});

test("the bookings list asks a visitor to log in", async ({ page }) => {
  await page.goto("/bookings");
  await expect(page).toHaveURL(/\/login/);
});
