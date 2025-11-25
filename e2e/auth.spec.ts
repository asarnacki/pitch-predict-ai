import { test, expect } from '@playwright/test';
import { LoginPage, NavigationPage } from './page-objects';

test.describe('Authentication Flow', () => {
  test('should login successfully with test user credentials', async ({ page }) => {
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error(
        'E2E_USERNAME and E2E_PASSWORD must be set in .env.test file'
      );
    }

    const loginPage = new LoginPage(page);
    const navigation = new NavigationPage(page);

    await page.goto('/');

    const isLoggedIn = await navigation.isLoggedIn();

    if (isLoggedIn) {
      await navigation.logout();

      await expect(navigation.loginLink).toBeVisible();
    }

    await loginPage.goto();

    await expect(page).toHaveURL('/login');
    await expect(loginPage.heading).toBeVisible();

    await loginPage.login(testEmail, testPassword);

    await loginPage.waitForSuccessfulLogin();

    await expect(navigation.logoutButton).toBeVisible({ timeout: 5000 });

    await expect(navigation.userEmail).toBeVisible();
    await expect(navigation.userEmail).toContainText(testEmail);

  });
});

