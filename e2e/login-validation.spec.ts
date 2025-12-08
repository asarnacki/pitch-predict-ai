import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Login Validation", () => {
  test("should show validation error for empty email on blur", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("a");
    await loginPage.emailInput.clear();
    await loginPage.passwordInput.click();

    const emailError = page.getByText("E-mail jest wymagany");
    await expect(emailError).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error for invalid email format", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("invalid-email");
    await loginPage.passwordInput.click();

    const emailError = page.getByText("Nieprawidłowy format e-mail");
    await expect(emailError).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error for short password", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.passwordInput.fill("short");
    await loginPage.emailInput.click();

    const passwordError = page.getByText("Hasło musi mieć co najmniej 8 znaków");
    await expect(passwordError).toBeVisible({ timeout: 10000 });
  });
});
