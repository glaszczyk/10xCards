# Środowisko Testowe 10xCards MVP

## 🎯 Przegląd

To jest kompletne środowisko testowe dla 10xCards MVP, zgodne z planem testów opartym na ryzyku biznesowym (20/80 rule).

## 🏗️ Architektura Testowa

### Narzędzia MVP

- **Vitest** - Unit & integration tests
- **Playwright** - E2E testing
- **@testing-library/react** - Component testing
- **MSW** - API mocking
- **GitHub Actions** - CI/CD pipeline

### Struktura Katalogów

```
src/__tests__/
├── critical/           # 80% business risk
│   ├── ai-generation.test.ts
│   ├── srs-algorithm.test.ts
│   ├── auth-flow.test.ts
│   └── core-crud.test.ts
├── components/         # Component tests
├── lib/               # Core utilities
├── mocks/             # MSW configuration
└── factories/         # Test data factories

tests/
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

## 🚀 Szybki Start

### Instalacja

```bash
npm install
```

### Uruchomienie Testów

#### Testy Krytyczne (MVP Priority)

```bash
npm run test:critical
```

#### Testy Komponentów

```bash
npm run test:components
```

#### Testy Integration

```bash
npm run test:integration
```

#### Testy E2E

```bash
npm run test:e2e
```

#### Wszystkie Testy MVP

```bash
npm run test:ci
```

#### Testy z UI

```bash
npm run test:ui
```

#### Coverage Report

```bash
npm run test:coverage
```

## 📊 Cele Pokrycia MVP

- **Critical Functions**: 90% (AI, SRS, Auth, CRUD)
- **Unit Tests Overall**: 60% (cel: 70%)
- **Integration Tests**: 40% (cel: 50%)
- **E2E Tests**: 3-5 critical user journeys
- **Total Execution**: < 3 minuty

## 🔧 Konfiguracja

### Vitest Configs

- `vitest.config.ts` - Główna konfiguracja
- `vitest.critical.config.ts` - Testy krytyczne
- `vitest.components.config.ts` - Testy komponentów
- `vitest.integration.config.ts` - Testy integration

### Playwright

- `playwright.config.ts` - Konfiguracja E2E
- Wspiera Chrome, Firefox, Safari

### MSW (Mock Service Worker)

- `src/__tests__/mocks/` - Mock handlers
- Automatyczne mockowanie API w testach

## 🧪 Typy Testów

### 1. Testy Krytyczne (Critical)

- **AI Flashcard Generation** - Core value proposition
- **SRS Learning Algorithm** - Core functionality
- **User Authentication** - Security & user management
- **Basic CRUD Operations** - Data persistence

### 2. Testy Komponentów

- React component testing
- User interaction testing
- Form validation testing

### 3. Testy Integration

- User journey testing
- Data provider testing
- API endpoint validation

### 4. Testy E2E

- Complete user flows
- Cross-browser testing
- Real user scenarios

## 🚦 CI/CD Pipeline

### GitHub Actions

- **Automatyczne testy** na push/PR
- **Timeout**: 10 minut (realistyczne dla MVP)
- **Coverage reporting** (nie blokuje CI)
- **Parallel execution** dla szybkości

### Workflow

1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Run critical tests
5. Run component tests
6. Run integration tests
7. Run E2E tests
8. Upload coverage

## 📝 Pisanie Testów

### Fabryki Testowe

```typescript
import { MVPTestData } from "@/__tests__/factories/mvp-test-data";

const flashcard = MVPTestData.createFlashcard({
  front: "Custom question?",
  back: "Custom answer",
});
```

### MSW Handlers

```typescript
// Automatyczne mockowanie API
// Nie trzeba ręcznie mockować w testach
```

### Best Practices MVP

- **KISS principle** - Simple, focused tests
- **Risk-based testing** - Focus on business value
- **Minimal setup** - Avoid over-engineering
- **Clear assertions** - Easy to understand

## 🔍 Debugging

### Vitest UI

```bash
npm run test:ui
```

### Playwright Inspector

```bash
npx playwright test --debug
```

### Coverage Report

```bash
npm run test:coverage
# Otwórz coverage/index.html
```

## 📈 Rozwój Post-MVP

### Phase 1: Coverage Expansion

- Increase unit test coverage to 80%
- Add performance testing
- Expand E2E test coverage

### Phase 2: Advanced Testing

- Add security testing
- Implement load testing
- Add mutation testing

### Phase 3: Quality Optimization

- Optimize test performance
- Reduce flaky tests
- Improve maintainability

## 🐛 Troubleshooting

### Common Issues

#### Test Environment

```bash
# Clear cache
rm -rf node_modules/.cache
npm run test:critical
```

#### MSW Issues

```bash
# Check handlers
npm run test:critical -- --reporter=verbose
```

#### Playwright Issues

```bash
# Install browsers
npx playwright install
# Clear cache
npx playwright install --force
```

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

## 🤝 Contributing

### Dodawanie Nowych Testów

1. Stwórz plik w odpowiednim katalogu
2. Użyj istniejących fabryk testowych
3. Dodaj do odpowiedniej konfiguracji
4. Uruchom testy lokalnie
5. Commit i push

### Konwencje Nazewnictwa

- `*.test.ts` - Unit/Integration tests
- `*.test.tsx` - Component tests
- `*.test.ts` - E2E tests (w katalogu tests/e2e/)

---

**Uwaga**: To środowisko testowe jest zoptymalizowane dla MVP. Testy są stopniowo rozwijane zgodnie z planem rozwoju.
