import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly heading: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly resetPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.heading = page.getByTestId('auth-form-heading');
    this.errorMessage = page.getByTestId('auth-form-error');
    this.registerLink = page.getByTestId('auth-register-link');
    this.resetPasswordLink = page.getByTestId('auth-reset-password-link');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async waitForSuccessfulLogin() {
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async hasError() {
    return await this.errorMessage.isVisible().catch(() => false);
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

