import { defineConfig, devices } from "@playwright/test";

// Own port, so the tests never hit another project's dev server on 3000.
const port = 3100;

// Mobile first: every journey runs on a phone viewport.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        // Locally, use the installed Google Chrome (Playwright has no Chromium for older macOS).
        // CI installs Playwright's Chromium.
        ...(process.env.CI ? {} : { channel: "chrome" }),
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
