# End-to-End Tests - 10xCards

## Overview

This directory contains end-to-end tests for the 10xCards application using Playwright. The tests are designed to validate critical user workflows and ensure the application functions correctly from a user's perspective.

## Test Structure

```
tests/e2e/
├── auth/                    # Authentication tests
│   ├── login.test.ts       # Login tests with authentication
│   └── login-no-auth.test.ts # Login tests without authentication
├── pages/                   # Page Object Models
│   └── LoginPage.ts        # Login page POM
├── auth.setup.ts           # Authentication setup for tests
└── README.md               # This file
```

## Test Categories

### 1. Authentication Tests (`auth/`)

- **Login with Auth**: Tests that require authenticated state
- **Login without Auth**: Tests that validate login functionality without authentication

### 2. Page Object Models (`pages/`)

- **LoginPage**: Encapsulates login page interactions and assertions

## Running Tests

### Prerequisites

1. Ensure the application is running (`npm run dev`)
2. Ensure test credentials are available in `.env`

### Available Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run authentication setup only
npm run test:e2e:setup

# Run login tests with authentication
npm run test:e2e:login

# Run login tests without authentication
npm run test:e2e:login-no-auth

# Run all authentication-related tests
npm run test:e2e:auth
```

### Test Execution Flow

1. **Setup Phase**: `auth.setup.ts` runs first to authenticate and save session state
2. **Authenticated Tests**: Tests that require authentication use the saved session
3. **No-Auth Tests**: Tests that don't require authentication run independently

## Test Credentials

The tests use the following credentials (stored in `.env`):

- Email: `test@gmail.com`
- Password: `aA1234`

## Page Object Model Pattern

We use the Page Object Model pattern to:

- Encapsulate page-specific logic
- Provide reusable methods for common actions
- Make tests more maintainable and readable

### Example Usage

```typescript
import { LoginPage } from "../pages/LoginPage";

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("test@gmail.com", "aA1234");
  await loginPage.expectRedirectToGenerate();
});
```

## Test Coverage

### Critical Business Functions (MVP)

- ✅ User authentication (login)
- ✅ Form validation
- ✅ Error handling
- ✅ Navigation and redirects
- ✅ Responsive behavior
- ✅ Accessibility features

### Test Scenarios Covered

#### Login Functionality

- Page load and form display
- Form validation (client-side)
- Successful login flow
- Error handling for invalid credentials
- Form state management
- Navigation and redirects
- Responsive behavior
- Accessibility and keyboard navigation

## Best Practices

1. **Use Page Object Models**: Encapsulate page logic in dedicated classes
2. **Descriptive Test Names**: Use clear, descriptive test names
3. **Proper Assertions**: Use appropriate Playwright assertions
4. **Test Isolation**: Each test should be independent
5. **Error Handling**: Test both success and failure scenarios
6. **Accessibility**: Include accessibility and keyboard navigation tests
7. **Responsive Testing**: Test on different viewport sizes

## Debugging

### Running Tests in Debug Mode

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run specific test with debug
npx playwright test --debug tests/e2e/auth/login.test.ts
```

### Viewing Test Results

```bash
# Open HTML report
npx playwright show-report

# View traces (if enabled)
npx playwright show-trace
```

## Configuration

The tests are configured in `playwright.config.ts` with:

- Multiple browser projects (Chrome, Firefox, Safari)
- Authentication setup project
- Separate project for non-authenticated tests
- Screenshot and trace capture on failure

## Future Enhancements

- [ ] Add more user journey tests
- [ ] Implement visual regression testing
- [ ] Add performance testing
- [ ] Expand accessibility testing
- [ ] Add cross-browser compatibility tests
