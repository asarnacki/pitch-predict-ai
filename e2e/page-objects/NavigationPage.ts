import { type Page, type Locator } from "@playwright/test";

export class NavigationPage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly logoutButton: Locator;
  readonly userEmail: Locator;
  readonly savedPredictionsLink: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginLink = page.getByTestId("nav-login-link");
    this.registerLink = page.getByTestId("nav-register-link");
    this.logoutButton = page.getByTestId("nav-logout-button");
    this.userEmail = page.getByTestId("nav-user-email");
    this.savedPredictionsLink = page.getByTestId("nav-predictions-link");
    this.logo = page.getByTestId("nav-logo");
  }

  async isLoggedIn() {
    return await this.logoutButton.isVisible().catch(() => false);
  }

  async isLoggedOut() {
    return await this.loginLink.isVisible().catch(() => false);
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL("/", { timeout: 5000 });
  }

  async goToLogin() {
    await this.loginLink.click();
  }

  async goToRegister() {
    await this.registerLink.click();
  }

  async goToSavedPredictions() {
    await this.savedPredictionsLink.click();
  }

  async getUserEmail() {
    return await this.userEmail.textContent();
  }

  async goToHome() {
    await this.logo.click();
  }
}
