import { test, expect } from "@playwright/test";

test.describe("Connectivity Tests", () => {
    test("should connect to deployed app", async ({ page }) => {
    // Get base URL from environment or use default
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321";
    console.log(`🌐 Testing connectivity to: ${baseURL}`);
    console.log(`📊 Environment: DATA_PROVIDER=${process.env.DATA_PROVIDER}, SUPABASE_URL=${process.env.SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    
    // Test main page
    console.log("📄 Loading main page...");
    await page.goto(baseURL);
    console.log("✅ Main page loaded successfully");
    
    // Check if page has basic content
    await expect(page.locator("body")).toBeVisible();
    console.log("✅ Body is visible");
    
    // Test login page
    console.log("🔐 Loading login page...");
    await page.goto(`${baseURL}/auth/login`);
    console.log("✅ Login page loaded successfully");
    
    // Check if login page has basic content
    await expect(page.locator("body")).toBeVisible();
    console.log("✅ Login page body is visible");
    
    // Check if we can see any text on the page
    const pageText = await page.textContent("body");
    console.log(`📝 Page contains text: ${pageText?.substring(0, 200)}...`);
    
    // Check for specific elements
    const hasForm = await page.locator('form').count();
    const hasEmailInput = await page.locator('#email').count();
    const hasPasswordInput = await page.locator('#password').count();
    console.log(`🔍 Found elements: form=${hasForm}, email input=${hasEmailInput}, password input=${hasPasswordInput}`);
    
    // Basic assertion that page loaded
    expect(pageText).toBeTruthy();
    console.log("🎉 Connectivity test completed successfully!");
  });

  test("should show environment info", async ({ page }) => {
    console.log("Environment variables:");
    console.log("PLAYWRIGHT_BASE_URL:", process.env.PLAYWRIGHT_BASE_URL);
    console.log("DATA_PROVIDER:", process.env.DATA_PROVIDER);
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

    // This test always passes, just for debugging
    expect(true).toBe(true);
  });
});
