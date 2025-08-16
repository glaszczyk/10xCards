import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load .env.test for local development, but not in CI
if (!process.env.CI) {
  config({ path: ".env.test" });
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Disable parallel execution to prevent test interference
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retries for flaky tests
  workers: 1, // Force single worker for stability
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321",
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
