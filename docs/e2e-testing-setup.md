# E2E Testing Setup with Cloud Supabase

## Overview

E2E tests are configured to run against a cloud Supabase instance for both local development and CI/CD.

## Environment Configuration

### Local Development

Create `.env.test` file with your cloud Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Test User Credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Playwright Configuration
PLAYWRIGHT_BASE_URL=http://localhost:4321
PLAYWRIGHT_TIMEOUT=30000
PLAYWRIGHT_RETRIES=2
```

### CI/CD Setup

Add the following secrets to your GitHub repository:

- `SUPABASE_URL`: Your cloud Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PLAYWRIGHT_BASE_URL`: Your deployed application URL (for CI)

**Note:** Test user credentials are configured in `.env.test` and will be used automatically.

#### Current Status

✅ **Application deployed on Vercel** - E2E tests are now enabled in CI/CD!

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/e2e/login.test.ts

# Run with specific browser
npx playwright test --project=chromium
```

### CI/CD

Tests run automatically on push/PR with the following workflow:

1. Install dependencies
2. Run critical tests
3. Run component tests
4. Run integration tests
5. Install Playwright browsers
6. Run E2E tests against cloud Supabase
7. Upload coverage

## Test Configuration

### Playwright Config

- Loads `.env.test` automatically
- Uses environment variables for base URL
- Disables web server in CI
- Configures single worker for stability

### Test Structure

- Uses Page Object Model (POM)
- Environment-aware credentials
- Fallback to mock data if env vars not set
- Proper test isolation with cleanup

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**: Ensure `.env.test` exists and has correct format
2. **Supabase connection failed**: Check URL and API key in environment
3. **Test user not found**: Verify test user exists in cloud database
4. **Tests timing out**: Increase `PLAYWRIGHT_TIMEOUT` in environment

### Debug Mode

```bash
# Run with debug output
DEBUG=pw:api npm run test:e2e

# Show browser during test execution
npx playwright test --headed
```
