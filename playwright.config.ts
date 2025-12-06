import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

/**
 * Load environment variables
 * - Local: load from .env.test
 * - CI: skip, use only GitHub Secrets
 */
const loadedFromFile = process.env.CI
  ? {}
  : dotenv.config({ path: path.resolve(process.cwd(), ".env.test") }).parsed || {};

const testEnv = {
  SUPABASE_URL: loadedFromFile.SUPABASE_URL || process.env.SUPABASE_URL,
  SUPABASE_KEY: loadedFromFile.SUPABASE_KEY || process.env.SUPABASE_KEY,
  OPENROUTER_API_KEY: loadedFromFile.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
  FOOTBALL_DATA_API_KEY: loadedFromFile.FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_API_KEY,
  E2E_USERNAME_ID: loadedFromFile.E2E_USERNAME_ID || process.env.E2E_USERNAME_ID,
  E2E_USERNAME: loadedFromFile.E2E_USERNAME || process.env.E2E_USERNAME,
  E2E_PASSWORD: loadedFromFile.E2E_PASSWORD || process.env.E2E_PASSWORD,
};

// Debug only in CI
if (process.env.CI) {
  console.log("DEBUG Playwright testEnv:", {
    fromFile: Object.keys(loadedFromFile),
    fromProcessEnv: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
      FOOTBALL_DATA_API_KEY: !!process.env.FOOTBALL_DATA_API_KEY,
    },
    final: {
      SUPABASE_URL: !!testEnv.SUPABASE_URL,
      SUPABASE_KEY: !!testEnv.SUPABASE_KEY,
    },
  });
}

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],

  webServer: {
    // 🚀 CI: Force env in command (Astro loads .env and overrides process.env → this bypasses it)
    command: process.env.CI
      ? `PORT=3001 SUPABASE_URL=${process.env.SUPABASE_URL} SUPABASE_KEY=${process.env.SUPABASE_KEY} astro dev`
      : "PORT=3001 astro dev --mode test",

    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,

    // Playwright env passed normally (used by tests themselves)
    env: testEnv,
  },
});
