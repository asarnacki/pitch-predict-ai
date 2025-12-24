import { test, expect } from "@playwright/test";

test.describe("Language Switcher", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.context().clearCookies();
    await page.goto("/");
  });

  test("should display language switcher in header", async ({ page }) => {
    const languageSwitcher = page.getByTestId("language-switcher");
    await expect(languageSwitcher).toBeVisible();
  });

  test("should show current language badge on switcher", async ({ page }) => {
    const languageSwitcher = page.getByTestId("language-switcher");
    await expect(languageSwitcher).toBeVisible();

    // Should display 'pl' or 'en' badge
    const text = await languageSwitcher.textContent();
    expect(text?.toLowerCase()).toMatch(/pl|en/);
  });

  test("should switch from Polish to English on login page", async ({ page }) => {
    await page.goto("/login");

    // Verify initial state is Polish
    const heading = page.getByTestId("auth-form-heading");
    await expect(heading).toHaveText("Zaloguj się");

    // Click language switcher
    const languageSwitcher = page.getByTestId("language-switcher");
    await languageSwitcher.click();

    // Wait for language change
    await page.waitForTimeout(100);

    // Verify text changed to English
    await expect(heading).toHaveText("Log in");
  });

  test("should persist language selection across page navigation", async ({ page }) => {
    await page.goto("/login");

    // Switch to English
    const languageSwitcher = page.getByTestId("language-switcher");
    await languageSwitcher.click();

    // Wait for language change
    await page.waitForTimeout(100);

    // Verify English on login page
    const loginHeading = page.getByTestId("auth-form-heading");
    await expect(loginHeading).toHaveText("Log in");

    // Navigate to register page
    await page.goto("/register");

    // Wait for page load
    await page.waitForLoadState("networkidle");

    // Verify language persisted to English
    const registerHeading = page.getByTestId("auth-form-heading");
    await expect(registerHeading).toHaveText("Sign up");
  });

  test("should translate main page content when switching language", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Get initial Polish subtitle
    const subtitle = page.locator("text=Wygeneruj predykcje AI dla nadchodzących meczów").first();
    await expect(subtitle).toBeVisible();

    // Switch to English
    const languageSwitcher = page.getByTestId("language-switcher");
    await languageSwitcher.click();

    // Wait for language change
    await page.waitForTimeout(200);

    // Verify English subtitle
    const englishSubtitle = page.locator("text=Generate AI predictions for upcoming matches").first();
    await expect(englishSubtitle).toBeVisible();
  });

  test("should update HTML lang attribute when language changes", async ({ page }) => {
    await page.goto("/");

    // Get initial lang attribute
    const initialLang = await page.getAttribute("html", "lang");
    expect(initialLang).toBeTruthy();

    // Click language switcher
    const languageSwitcher = page.getByTestId("language-switcher");
    await languageSwitcher.click();

    // Wait for change
    await page.waitForTimeout(100);

    // Get new lang attribute
    const newLang = await page.getAttribute("html", "lang");
    expect(newLang).toBeTruthy();

    // Should be different from initial
    expect(newLang).not.toBe(initialLang);

    // Should be either 'pl' or 'en'
    expect(["pl", "en"]).toContain(newLang);
  });
});
