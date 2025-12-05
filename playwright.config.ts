import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

/**
 * Load environment variables from .env.test (local) or process.env (CI)
 * In local development: loads from .env.test
 * In GitHub Actions: uses environment secrets passed to the job
 */
const testEnv = dotenv.config({ path: path.resolve(process.cwd(), ".env.test") }).parsed || {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  FOOTBALL_DATA_API_KEY: process.env.FOOTBALL_DATA_API_KEY,
  E2E_USERNAME_ID: process.env.E2E_USERNAME_ID,
  E2E_USERNAME: process.env.E2E_USERNAME,
  E2E_PASSWORD: process.env.E2E_PASSWORD,
};

/**
 * Playwright E2E Test Configuration
 *
 * Key features:
 * - Loads .env.test and passes variables to webServer via env property
 * - Tests run against test Supabase database (not production)
 * - Supports multiple browsers and mobile viewports
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3001",

    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
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

    /* Mobile Viewports - CRITICAL for Mobile First strategy */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  webServer: {
    command: "PORT=3001 astro dev --mode test",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: testEnv, // Pass .env.test variables to the server (backup for process.env)
  },
});
