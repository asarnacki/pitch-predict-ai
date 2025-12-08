import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Login Validation", () => {
  test("should show validation error for empty email on blur", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Focus and blur email field to trigger validation
    await loginPage.emailInput.focus();
    await loginPage.passwordInput.focus();

    const emailError = page.getByText("E-mail jest wymagany");
    await expect(emailError).toBeVisible();
  });

  test("should show validation error for invalid email format", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("invalid-email");
    // Blur by focusing another element
    await loginPage.passwordInput.focus();

    const emailError = page.getByText("Nieprawidłowy format e-mail");
    await expect(emailError).toBeVisible();
  });

  test("should show validation error for short password", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.passwordInput.fill("short");
    // Blur by focusing another element
    await loginPage.emailInput.focus();

    const passwordError = page.getByText("Hasło musi mieć co najmniej 8 znaków");
    await expect(passwordError).toBeVisible();
  });
});
