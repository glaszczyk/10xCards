import { test, expect } from "@playwright/test";
import { LoginPage } from "./LoginPage";

test.describe("Login Functionality", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Clear any existing state
    await page.context().clearCookies();
    await page.goto("about:blank");
  });

  test("should display login page with all required elements", async ({
    page,
  }) => {
    await loginPage.goto();

    // Verify page title and description
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    await expect(
      page.locator(
        'p.text-muted-foreground:has-text("Sign in to your account to continue learning")'
      )
    ).toBeVisible();

    // Verify form elements
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // Verify form labels - using the actual label text from LoginForm
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  test("should show error for empty email", async ({ page }) => {
    await loginPage.goto();

    // Wait for form to be fully loaded
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // Fill password first, then try to submit with empty email
    await loginPage.fillPassword("aA1234");
    await expect(loginPage.passwordInput).toHaveValue("aA1234");

    // Submit form
    await loginPage.clickLogin();

    // Wait for error to appear with retry logic
    await expect(async () => {
      await expect(loginPage.errorAlert).toBeVisible();
      await expect(loginPage.errorAlert).toContainText("Email is required");
    }).toPass({ timeout: 5000 });
  });

  test("should show error for empty password", async ({ page }) => {
    await loginPage.goto();

    // Wait for form to be fully loaded and interactive
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();

    // Fill email first, then try to submit with empty password
    await loginPage.fillEmail("test@gmail.com");

    // Verify email was filled and wait for it to settle
    await expect(loginPage.emailInput).toHaveValue("test@gmail.com");
    await page.waitForTimeout(200);

    // Ensure password field is empty
    await loginPage.passwordInput.clear();
    await expect(loginPage.passwordInput).toHaveValue("");

    // Submit form and wait for validation
    await loginPage.clickLogin();

    // Wait for error to appear with retry logic
    await expect(async () => {
      await expect(loginPage.errorAlert).toBeVisible();
      await expect(loginPage.errorAlert).toContainText(
        "Password must be at least 6 characters"
      );
    }).toPass({ timeout: 5000 });
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    await loginPage.goto();

    // Wait for form to be fully loaded
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();

    // Verify initial state: user is NOT authenticated (header shows no user menu)
    await expect(
      page.locator('[data-testid="sign-out-button"]')
    ).not.toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="main-navigation"]')
    ).not.toBeVisible();

    // Fill in valid credentials from environment variables or fallback to mock data
    const email = process.env.TEST_USER_EMAIL || "test@example.com";
    const password = process.env.TEST_USER_PASSWORD || "testpassword123";

    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);

    // Verify credentials were filled
    await expect(loginPage.emailInput).toHaveValue(email);
    await expect(loginPage.passwordInput).toHaveValue(password);

    // Submit form
    await loginPage.clickLogin();

    // Wait for Supabase session to be set in localStorage (this confirms user is logged in)
    await expect(async () => {
      const session = await page.evaluate(() => {
        return localStorage.getItem("sb-localhost:54321-auth-token");
      });
      return session !== null;
    }).toBeTruthy();
  });

  test("should clear form errors when user starts typing", async ({ page }) => {
    await loginPage.goto();

    // Submit with invalid data to show error
    await loginPage.clickLogin();
    await loginPage.expectError("Email is required");

    // Start typing in email field
    await loginPage.fillEmail("test@gmail.com");

    // Error should be cleared
    await loginPage.expectNoError();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await loginPage.goto();

    // Verify initial state: no error message visible
    await expect(
      page.locator("text=Invalid login credentials")
    ).not.toBeVisible();

    // Try to login with wrong password
    await loginPage.fillEmail("test@gmail.com");
    await loginPage.fillPassword("wrongpassword");
    await loginPage.clickLogin();

    // Should show authentication error
    await expect(page.locator("text=Invalid login credentials")).toBeVisible();
  });
});
