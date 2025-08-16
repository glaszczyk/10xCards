import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators for form elements - using more specific selectors
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.getByRole("button", { name: "Sign In" });

    // Locators for feedback elements
    this.errorAlert = page.locator('[role="alert"], .destructive');

    // Page identification - using the actual title from AuthLayout
    this.pageTitle = page.getByRole("heading", { name: "Welcome back" });
  }

  // Navigation
  async goto() {
    await this.page.goto("/auth/login");
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  // Form interactions
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // Validation and feedback
  async expectError(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  async expectNoError() {
    await expect(this.errorAlert).not.toBeVisible();
  }

  // Success scenarios
  async expectRedirectToGenerate() {
    await expect(this.page).toHaveURL("/generate");
  }

  // Utility methods
  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
