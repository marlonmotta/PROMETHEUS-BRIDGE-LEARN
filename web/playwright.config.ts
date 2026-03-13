import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration for PBL Web.
 *
 * Runs against the Vite dev server (npm run dev).
 *
 * Usage:
 *   npx playwright test              # run all tests
 *   npx playwright test --ui         # interactive UI mode
 *   npx playwright show-report       # view HTML report
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
