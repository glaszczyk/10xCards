# CI/CD Workflows

## Overview
This directory contains GitHub Actions workflows for the 10xCards application.

## Current Workflows

### MVP Test Suite (`mvp-test-suite.yml`)
**Trigger**: `push`, `pull_request`  
**Status**: ✅ Active  
**Purpose**: Run comprehensive test suite for MVP features

#### What It Tests
- **Critical Tests**: Core business logic and SRS algorithm
- **Component Tests**: React component functionality
- **Integration Tests**: API endpoints and data providers
- **E2E Tests**: ~~Currently disabled~~ (placeholder tests only)

#### Current Status
- ✅ **Critical Tests**: 4/4 passing
- ✅ **Component Tests**: 18/18 passing  
- ✅ **Integration Tests**: 3/3 passing
- ⚠️ **E2E Tests**: Disabled (placeholder tests only)

#### E2E Tests Status
E2E tests are currently **disabled** in CI because:
- Tests are only placeholders (`expect(true).toBe(true)`)
- No real functionality is tested
- Would cause CI failures due to missing implementation

**Plan**: Enable E2E tests in Q1 2025 when proper tests are implemented.

## Test Commands

### Local Development
```bash
# Run all test suites
npm test

# Run specific test suites
npm run test:critical      # Core business logic
npm run test:components    # React components
npm run test:integration   # API and data providers
npm run test:e2e          # End-to-end tests (when ready)
```

### CI/CD
```bash
# These commands run automatically in GitHub Actions
npm ci                     # Install dependencies
npm run test:critical     # Critical business logic
npm run test:components   # Component tests
npm run test:integration  # Integration tests
# npm run test:e2e       # E2E tests (disabled)
```

## Future Workflows

### Performance Testing (Post-MVP)
```yaml
# performance:
#   runs-on: ubuntu-latest
#   needs: test
#   steps:
#     - name: Lighthouse CI
#       run: npm run test:performance
```

### Security Testing (Post-MVP)
```yaml
# security:
#   runs-on: ubuntu-latest
#   needs: test
#   steps:
#     - name: OWASP ZAP
#       run: npm run test:security
```

## Configuration

### Environment Variables
- `DATA_PROVIDER=mock` - Use mock data for tests
- `CI=true` - Enable CI-specific settings

### Timeouts
- **Job Timeout**: 10 minutes (realistic for MVP)
- **Test Timeout**: 5 minutes per test suite
- **Web Server Timeout**: 120 seconds for E2E tests

### Dependencies
- **Node.js**: Version 20
- **Package Manager**: npm (with caching)
- **Browsers**: Playwright (when E2E tests are enabled)

## Troubleshooting

### Common Issues

#### E2E Tests Failing
**Problem**: `Executable doesn't exist at /home/runner/.cache/ms-playwright/...`  
**Solution**: Tests are disabled in CI until proper implementation

#### Test Timeouts
**Problem**: Tests taking too long in CI  
**Solution**: Check for infinite loops or slow operations

#### Coverage Issues
**Problem**: Coverage reports failing  
**Solution**: Coverage upload is non-blocking (`fail_ci_if_error: false`)

### Debugging
- Check test logs in GitHub Actions
- Run tests locally to reproduce issues
- Review test configuration files
- Check for environment-specific issues

## Best Practices

### Test Development
- Write fast, reliable tests
- Use mock data when possible
- Avoid external dependencies
- Keep tests under 5 minutes total

### CI/CD
- Don't block builds for non-critical failures
- Use appropriate timeouts
- Cache dependencies when possible
- Provide clear error messages

### Maintenance
- Update test dependencies regularly
- Monitor test execution times
- Review and update test coverage
- Plan for E2E test implementation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Testing Framework](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)
- [Test Coverage Best Practices](https://docs.codecov.io/docs)
