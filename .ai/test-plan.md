# Plan Testów Automatycznych - 10xCards MVP (Wersja Ulepszona)

## 1. Filozofia Testowania MVP

### 1.1 Zasady MVP-First

- **20/80 Rule**: 20% testów pokrywa 80% ryzyka biznesowego
- **Risk-Based Testing**: Testuj według business impact, nie technical completeness
- **Iterative Growth**: Rozwijaj testy stopniowo po MVP release
- **Pragmatic Coverage**: Realistyczne cele pokrycia dla ograniczonych zasobów

### 1.2 Krytyczne Funkcje MVP (Must-Test)

1. **AI Flashcard Generation** - Core value proposition
2. **SRS Learning Algorithm** - Core functionality
3. **User Authentication** - Security & user management
4. **Basic CRUD Operations** - Data persistence
5. **Core User Journeys** - End-to-end workflows

## 2. Uproszczona Architektura Testowa

### 2.1 Narzędzia MVP (Minimal Viable Testing Stack)

```
Core Testing:
├── Vitest - Unit & integration tests
├── Playwright - E2E testing
├── @testing-library/react - Component testing
└── MSW - API mocking

Infrastructure:
├── GitHub Actions - Basic CI
├── Coverage reporting - Simple metrics
└── Test data factories - Reusable test data
```

### 2.2 Post-MVP Tools (Do Dodania Później)

- Lighthouse CI (performance)
- OWASP ZAP (security)
- Artillery (load testing)
- Advanced CI/CD features

## 3. Struktura Testów MVP

### 3.1 Hierarchia Testów (Risk-Based)

```
src/
├── __tests__/
│   ├── critical/           # 80% business risk
│   │   ├── ai-generation.test.ts
│   │   ├── srs-algorithm.test.ts
│   │   ├── auth-flow.test.ts
│   │   └── core-crud.test.ts
│   ├── components/         # Basic component tests
│   │   ├── auth/
│   │   ├── generate/
│   │   └── learn/
│   └── lib/               # Core utilities
```

### 3.2 Testy Integration (Minimal)

```
tests/
├── integration/
│   ├── user-journey.test.ts    # 3-5 critical flows
│   ├── data-provider.test.ts   # Provider switching
│   └── api-endpoints.test.ts   # Core API validation
```

### 3.3 Testy E2E (Focused)

```
tests/
├── e2e/
│   ├── complete-user-flow.test.ts    # Registration → Generation → Learning
│   ├── ai-generation-flow.test.ts    # Text input → AI processing → Cards
│   └── learning-session.test.ts      # SRS workflow
```

## 4. Realistyczne Cele Pokrycia MVP

### 4.1 Pokrycie Kodu (Pragmatyczne)

```
MVP Coverage Goals:
├── Critical Functions: 90% (AI, SRS, Auth, CRUD)
├── Unit Tests Overall: 60% (cel: 70%)
├── Integration Tests: 40% (cel: 50%)
├── E2E Tests: 3-5 critical user journeys
└── Total Test Execution: < 3 minuty
```

### 4.2 Post-MVP Goals (Po Release)

```
Future Coverage Goals:
├── Unit Tests: 80% (cel: 90%)
├── Integration Tests: 70% (cel: 85%)
├── E2E Tests: 10+ user journeys
└── Performance & Security: Full coverage
```

## 5. Konkretne Przypadki Testowe MVP

### 5.1 AI Flashcard Generation (Critical Path)

```typescript
describe("AI Flashcard Generation - MVP Critical", () => {
  it("should generate 3-7 flashcards from valid text input", async () => {
    // Test core AI integration
    // Verify flashcard count and quality
    // Check error handling
  });

  it("should handle AI API failures gracefully", async () => {
    // Test network failures
    // Verify user feedback
    // Check fallback mechanisms
  });

  it("should validate input constraints (1000-10000 chars)", async () => {
    // Test input validation
    // Verify UI feedback
  });
});
```

### 5.2 SRS Algorithm (Core Functionality)

```typescript
describe("SRS Algorithm - MVP Critical", () => {
  it("should calculate correct next review dates", () => {
    // Test basic SRS calculations
    // Verify interval progression
  });

  it("should handle different rating scenarios", async () => {
    // Test rating 1-5
    // Verify ease factor adjustments
  });

  it("should maintain learning progress across sessions", async () => {
    // Test data persistence
    // Verify session continuity
  });
});
```

### 5.3 Authentication Flow (Security)

```typescript
describe("Authentication - MVP Critical", () => {
  it("should complete full auth flow (register → login → logout)", async () => {
    // Test complete user journey
    // Verify session management
  });

  it("should protect routes from unauthorized access", async () => {
    // Test route protection
    // Verify redirects
  });

  it("should handle auth errors gracefully", async () => {
    // Test invalid credentials
    // Verify error messages
  });
});
```

## 6. Uproszczona Konfiguracja CI/CD

### 6.1 GitHub Actions (MVP Version)

```yaml
name: MVP Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10 # Realistic timeout

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run critical tests
        run: npm run test:critical
        env:
          DATA_PROVIDER: mock

      - name: Run basic component tests
        run: npm run test:components

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 6.2 Test Scripts (Simplified)

```json
{
  "scripts": {
    "test": "npm run test:critical && npm run test:components",
    "test:critical": "vitest run --config vitest.critical.config.ts",
    "test:components": "vitest run --config vitest.components.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage --reporter=html",
    "test:watch": "vitest",
    "test:ci": "npm run test:critical && npm run test:components && npm run test:integration"
  }
}
```

## 7. Harmonogram Implementacji MVP (4-6 tygodni)

### 7.1 Tydzień 1-2: Foundation

```
Priorytet: WYSOKI
Zadania:
├── Setup test environment (Vitest + Playwright)
├── Test data factories
├── Critical function tests (AI, SRS)
└── Basic CI pipeline
```

### 7.2 Tydzień 3-4: Core Components

```
Priorytet: WYSOKI
Zadania:
├── Auth component tests
├── Generate component tests
├── Basic integration tests
└── E2E critical flows
```

### 7.3 Tydzień 5-6: Integration & Release

```
Priorytet: ŚREDNI
Zadania:
├── Complete integration tests
├── MVP release
├── Post-release test expansion planning
└── Coverage optimization
```

## 8. Test Data Management (MVP Version)

### 8.1 Simplified Test Factories

```typescript
// Minimal test data for MVP
export class MVPTestData {
  static createFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
    return {
      id: "test-id-1",
      front: "Test Question?",
      back: "Test Answer",
      source: "ai",
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: "test-user-1",
      email: "test@example.com",
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createSRSCard(overrides: Partial<SRSCard> = {}): SRSCard {
    return {
      id: "test-srs-1",
      ease_factor: 2.5,
      repetitions: 0,
      interval: 0,
      next_review_at: new Date().toISOString(),
      state: "new",
      ...overrides,
    };
  }
}
```

### 8.2 Test Isolation (Simplified)

```typescript
// Basic cleanup for MVP
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

beforeEach(() => {
  // Mock only essential external dependencies
  vi.mock("@/lib/data/provider-factory", () => ({
    DataProviderFactory: {
      getProvider: vi.fn(() => new MockProvider()),
    },
  }));
});
```

## 9. Risk-Based Testing Strategy

### 9.1 High Risk Areas (Test Thoroughly)

```
AI Integration:
├── API reliability
├── Response validation
├── Error handling
└── Rate limiting

SRS Algorithm:
├── Calculation accuracy
├── Data persistence
├── Session continuity
└── Edge cases

Authentication:
├── Security
├── Session management
├── Route protection
└── Error handling
```

### 9.2 Medium Risk Areas (Basic Testing)

```
UI Components:
├── Basic functionality
├── User interactions
├── Form validation
└── Error states

Data Operations:
├── CRUD operations
├── Validation
├── Error handling
└── Basic edge cases
```

### 9.3 Low Risk Areas (Minimal Testing)

```
Utilities:
├── Basic function coverage
├── Error handling
└── Edge cases

Styling:
├── Basic visual tests
└── Responsiveness
```

## 10. Success Metrics dla MVP

### 10.1 Technical Metrics

```
Test Coverage:
├── Critical Functions: > 90%
├── Overall Code: > 60%
├── Integration: > 40%
└── E2E: 3-5 user journeys

Performance:
├── Test Execution: < 3 min
├── CI Pipeline: < 10 min
└── Flaky Tests: < 5%
```

### 10.2 Business Metrics

```
User Experience:
├── Core flows work end-to-end
├── AI generation is reliable
├── Learning algorithm functions correctly
├── Authentication is secure
└── Data persistence is reliable

Quality:
├── Critical bugs caught before production
├── Regression prevention
├── Fast feedback loop
└── Maintainable test suite
```

## 11. Post-MVP Expansion Plan

### 11.1 Phase 1: Coverage Expansion (Miesiąc 2-3)

```
Goals:
├── Increase unit test coverage to 80%
├── Add performance testing
├── Expand E2E test coverage
└── Add accessibility testing
```

### 11.2 Phase 2: Advanced Testing (Miesiąc 4-6)

```
Goals:
├── Add security testing
├── Implement load testing
├── Add mutation testing
└── Advanced CI/CD features
```

### 11.3 Phase 3: Quality Optimization (Miesiąc 7+)

```
Goals:
├── Optimize test performance
├── Reduce flaky tests
├── Improve test maintainability
└── Add advanced monitoring
```

## 12. Najlepsze Praktyki MVP

### 12.1 Test Writing

```typescript
// KISS principle for MVP
it("should generate flashcards from valid text", async () => {
  // Simple, focused test
  // Clear assertions
  // Minimal setup
});

// Avoid over-engineering
// Don't test implementation details
// Focus on behavior, not structure
```

### 12.2 Test Maintenance

```
MVP Principles:
├── Write tests that are easy to understand
├── Use descriptive test names
├── Keep tests independent
├── Minimize test data complexity
└── Focus on business value
```

## 13. Identyfikacja Ryzyk i Mitigacja

### 13.1 MVP-Specific Risks

```
Resource Constraints:
├── Risk: Limited time for comprehensive testing
├── Mitigation: Focus on critical paths only

Technical Complexity:
├── Risk: Over-engineering test infrastructure
├── Mitigation: Start simple, iterate

Coverage Gaps:
├── Risk: Missing critical functionality
├── Mitigation: Risk-based prioritization
```

### 13.2 Mitigation Strategies

```
Immediate:
├── Focus on 20% critical functions
├── Use simple, proven tools
├── Iterative test development

Long-term:
├── Gradual coverage expansion
├── Tool sophistication growth
├── Process optimization
```

---

## Podsumowanie Ulepszonego Planu

### 🎯 **Kluczowe Zmiany**

1. **MVP-First Approach**: Realistyczne cele dla ograniczonych zasobów
2. **Risk-Based Testing**: 20% testów pokrywa 80% ryzyka biznesowego
3. **Simplified Infrastructure**: Podstawowe narzędzia, stopniowe rozwijanie
4. **Iterative Growth**: Plan rozwoju po MVP release

### 🚀 **Korzyści**

- **Szybszy MVP Release**: Mniej czasu na testy, więcej na funkcjonalność
- **Focused Quality**: Testy skupione na krytycznych funkcjach
- **Maintainable**: Prosty test suite łatwy w utrzymaniu
- **Scalable**: Plan rozwoju po MVP

### 📊 **Realistyczne Cele**

- **4-6 tygodni** na implementację testów MVP
- **60% pokrycie** kodu (krytyczne funkcje: 90%)
- **3-5 E2E flows** pokrywających core user journeys
- **< 3 minuty** wykonania pełnego test suite

Ten plan zapewnia **wysoką jakość MVP** przy **realistycznych nakładach** i **jasnej ścieżce rozwoju** na przyszłość.
