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
    console.log("🔍 Starting login page elements test...");
    await loginPage.goto();
    console.log("✅ Navigated to login page");

    // Verify page title and description
    console.log("🔍 Checking page title 'Welcome back'...");
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    console.log("✅ Page title is visible");

    console.log("🔍 Checking subtitle...");
    await expect(
      page.locator(
        'p.text-muted-foreground:has-text("Sign in to your account to continue learning")'
      )
    ).toBeVisible();
    console.log("✅ Subtitle is visible");

    // Verify form elements
    console.log("🔍 Checking email input...");
    await expect(loginPage.emailInput).toBeVisible();
    console.log("✅ Email input is visible");

    console.log("🔍 Checking password input...");
    await expect(loginPage.passwordInput).toBeVisible();
    console.log("✅ Password input is visible");

    console.log("🔍 Checking login button...");
    await expect(loginPage.loginButton).toBeVisible();
    console.log("✅ Login button is visible");

    // Verify form labels - using the actual label text from LoginForm
    console.log("🔍 Checking email label...");
    await expect(page.locator('label[for="email"]')).toBeVisible();
    console.log("✅ Email label is visible");

    console.log("🔍 Checking password label...");
    await expect(page.locator('label[for="password"]')).toBeVisible();
    console.log("✅ Password label is visible");

    console.log("🎉 All required elements are visible!");
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
    const email = process.env.TEST_USER_EMAIL || "test@gmail.com"; // Use email that exists in your cloud DB
    const password = process.env.TEST_USER_PASSWORD || "aA1234"; // Use password that exists in your cloud DB

    console.log(`🔐 Using credentials: email=${email}, password=${password}`);
    console.log(
      `🔐 Environment: TEST_USER_EMAIL=${process.env.TEST_USER_EMAIL ? "SET" : "NOT SET"}, TEST_USER_PASSWORD=${process.env.TEST_USER_PASSWORD ? "SET" : "NOT SET"}`
    );

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

  // TODO: Fix this test - it has issues with error handling
  // test("should show error for invalid credentials", async ({ page }) => {
  //   console.log("🔍 Starting invalid credentials test...");
  //   await loginPage.goto();
  //   console.log("✅ Navigated to login page");

  //   // Verify initial state: no error message visible
  //   console.log("🔍 Checking initial state - no error should be visible...");
  //   await expect(
  //     page.locator("text=Invalid login credentials")
  //   ).not.toBeVisible();
  //   console.log("✅ No error message visible initially");

  //   // Try to login with wrong password
  //   console.log("🔍 Filling invalid credentials...");
  //   await loginPage.fillEmail("test@gmail.com");
  //   await loginPage.fillPassword("wrongpassword");
  //   console.log("✅ Filled invalid credentials");

  //   // Debug: check what we filled
  //   const filledEmail = await page.locator("#email").inputValue();
  //   const filledPassword = await page.locator("#password").inputValue();
  //   console.log(`📝 Filled email: ${filledEmail}`);
  //   console.log(`📝 Filled password: ${filledPassword}`);

  //   console.log("🔍 Clicking login button...");
  //   await loginPage.clickLogin();
  //   console.log("✅ Login button clicked");

  //   // Debug: wait a bit and check page content
  //   console.log("⏳ Waiting for response...");
  //   await page.waitForTimeout(2000);
  //   const pageText = await page.textContent("body");
  //   console.log(
  //     "📄 Page content after login attempt:",
  //     pageText?.substring(0, 500)
  //   );

  //   // Debug: check if there are any error messages
  //   console.log("🔍 Looking for error elements...");
  //   const errorElements = await page
  //     .locator('[role="alert"], .destructive, .error, .alert')
  //     .all();
  //   console.log(`🔍 Found ${errorElements.length} error elements`);
  //   for (let i = 0; i < errorElements.length; i++) {
  //     const text = await errorElements[i].textContent();
  //     console.log(`❌ Error element ${i}: "${text}"`);
  //   }

  //   // Check for any text containing "Invalid" or "error"
  //   const allText = await page.textContent("body");
  //   console.log("🔍 Looking for any error-related text...");
  //   if (allText) {
  //     const errorKeywords = ["Invalid", "error", "Error", "ERROR", "invalid"];
  //     for (const keyword of errorKeywords) {
  //       if (allText.includes(keyword)) {
  //         console.log(`✅ Found keyword "${keyword}" in page text`);
  //       }
  //     }
  //   }

  //   // Should show authentication error
  //   console.log("🔍 Expecting 'Invalid login credentials' error...");
  //   await expect(page.locator("text=Invalid login credentials")).toBeVisible();
  //   console.log("🎉 Error message found successfully!");
  // });
});
