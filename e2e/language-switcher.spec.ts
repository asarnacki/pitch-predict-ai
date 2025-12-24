import { test, expect } from "@playwright/test";

test.describe("Language Switcher", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.getByTestId("language-switcher-trigger")).toHaveAttribute("data-hydrated", "true");
  });

  test("should display language switcher in header", async ({ page }) => {
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await expect(languageSwitcher).toBeVisible();
  });

  test("should show current language label on switcher", async ({ page }) => {
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await expect(languageSwitcher).toBeVisible();

    // Should display 'Polski' or 'English'
    const text = await languageSwitcher.textContent();
    expect(text?.toLowerCase()).toMatch(/polski|english/);
  });

  test("should switch from Polish to English on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("auth-form")).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("language-switcher-trigger")).toHaveAttribute("data-hydrated", "true");

    // Verify initial state is Polish
    const heading = page.getByTestId("auth-form-heading");
    await expect(heading).toHaveText("Zaloguj się");

    // Open language dropdown
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await languageSwitcher.click();

    // Select English
    const enOption = page.getByTestId("language-option-en");
    await expect(enOption).toBeVisible();
    await enOption.click();

    // Wait for language change
    await page.waitForTimeout(100);

    // Verify text changed to English
    await expect(heading).toHaveText("Log in");
  });

  test("should persist language selection across page navigation", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("auth-form")).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("language-switcher-trigger")).toHaveAttribute("data-hydrated", "true");

    // Switch to English
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await languageSwitcher.click();
    await page.getByTestId("language-option-en").click();

    // Wait for language change
    await page.waitForTimeout(100);

    // Verify English on login page
    const loginHeading = page.getByTestId("auth-form-heading");
    await expect(loginHeading).toHaveText("Log in");

    // Navigate to register page
    await page.goto("/register");
    await expect(page.getByTestId("auth-form")).toHaveAttribute("data-hydrated", "true");

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
    await expect(page.getByTestId("language-switcher-trigger")).toHaveAttribute("data-hydrated", "true");

    // Get initial Polish subtitle
    const subtitle = page.locator("text=Wygeneruj predykcje AI dla nadchodzących meczów").first();
    await expect(subtitle).toBeVisible();

    // Switch to English
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await languageSwitcher.click();
    await page.getByTestId("language-option-en").click();

    // Wait for language change
    await page.waitForTimeout(200);

    // Verify English subtitle
    const englishSubtitle = page.locator("text=Generate AI predictions for upcoming matches").first();
    await expect(englishSubtitle).toBeVisible();
  });

  test("should update HTML lang attribute when language changes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("language-switcher-trigger")).toHaveAttribute("data-hydrated", "true");

    // Get initial lang attribute
    const initialLang = await page.getAttribute("html", "lang");
    expect(initialLang).toBeTruthy();

    // Open language dropdown
    const languageSwitcher = page.getByTestId("language-switcher-trigger");
    await languageSwitcher.click();

    // Toggle language (if PL select EN, if EN select PL)
    const targetLang = initialLang === "pl" ? "en" : "pl";
    await expect(page.getByTestId(`language-option-${targetLang}`)).toBeVisible();
    await page.getByTestId(`language-option-${targetLang}`).click();

    // Get new lang attribute
    const newLang = await page.getAttribute("html", "lang");
    expect(newLang).toBeTruthy();

    // Should be different from initial
    expect(newLang).not.toBe(initialLang);

    // Should be either 'pl' or 'en'
    expect(["pl", "en"]).toContain(newLang);
  });
});
