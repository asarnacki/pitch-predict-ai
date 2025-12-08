import { test, expect } from "@playwright/test";
import { LoginPage, NavigationPage } from "./page-objects";

test.describe("Navigation", () => {
  test("should navigate from login to register page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.registerLink.click();

    await expect(page).toHaveURL("/register");
  });

  test("should navigate from login to reset password page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.resetPasswordLink.click();

    await expect(page).toHaveURL("/reset-password");
  });
});
