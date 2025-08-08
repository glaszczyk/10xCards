# Plan Implementacji UI - MVP 10xCards

## Wstęp i Założenia

### Stack Technologiczny

- **Frontend**: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui
- **Backend**: Supabase (BaaS, PostgreSQL, Auth)
- **AI**: Openrouter.ai dla generowania fiszek
- **Obsługa stanu**: React hooks (useState, useEffect) + Supabase Auth context

### Struktura Projektu

```
src/
├── components/          # Komponenty React (shadcn/ui + custom)
│   ├── ui/             # shadcn/ui base components
│   ├── auth/           # Komponenty uwierzytelniania
│   ├── generate/       # Komponenty generowania fiszek
│   ├── learn/          # Komponenty nauki
│   ├── manage/         # Komponenty zarządzania
│   └── shared/         # Wspólne komponenty
├── layouts/            # Astro layouts
├── pages/              # Astro pages + API routes
│   ├── auth/           # Strony uwierzytelniania
│   ├── api/v1/         # API endpoints (istniejące)
│   └── [app pages]     # Główne strony aplikacji
├── lib/                # Utilities i konfiguracja
│   ├── supabase.ts     # Supabase client (istniejący)
│   ├── auth.tsx        # Auth helpers (ZREALIZOWANE)
│   ├── api.ts          # API helpers (ZREALIZOWANE)
│   └── utils.ts        # Wspólne utilities
└── styles/             # Globalne style
```

## Podział na Moduły MVP

### 1. Moduł Uwierzytelniania (`/auth`)

**Cel**: Rejestracja, logowanie, podstawowa nawigacja

**Ekrany**:

- `/auth/login` - Logowanie użytkownika
- `/auth/register` - Rejestracja nowego użytkownika

**Komponenty**:

- `LoginForm` - formularz logowania
- `RegisterForm` - formularz rejestracji
- `AuthLayout` - layout dla stron uwierzytelniania

### 2. Moduł Generowania (`/generate`)

**Cel**: AI generation, edycja, ręczne tworzenie fiszek

**Ekrany**:

- `/generate` - Główny ekran generowania

**Komponenty**:

- `SourceTextInput` - pole tekstu źródłowego
- `GeneratedFlashcardsList` - lista wygenerowanych fiszek
- `SourceTextDisplay` - wyświetlanie tekstu źródłowego
- `ManualFlashcardForm` - ręczne dodawanie fiszek

### 3. Moduł Nauki (`/learn`)

**Cel**: Sesja powtórek z algorytmem SRS

**Ekrany**:

- `/learn` - Sesja nauki

**Komponenty**:

- `LearningSession` - główny komponent sesji
- `FlashcardViewer` - wyświetlacz pojedynczej fiszki
- `SessionProgress` - postęp sesji

### 4. Moduł Zarządzania (`/manage`)

**Cel**: Przeglądanie, edycja, usuwanie fiszek

**Ekrany**:

- `/manage` - Lista wszystkich fiszek

**Komponenty**:

- `FlashcardsList` - lista fiszek
- `FlashcardCard` - karta pojedynczej fiszki
- `EditFlashcardModal` - modal edycji
- `DeleteFlashcardDialog` - dialog usuwania

### 5. Komponenty Wspólne

**Cel**: Layout, nawigacja, obsługa błędów, feedback

**Komponenty**:

- `MainLayout` - główny layout aplikacji (ZREALIZOWANE)
- `Navigation` - nawigacja główna (ZREALIZOWANE)
- `ErrorBoundary` - granica błędów React (ZREALIZOWANE)
- `UniversalError` - uniwersalny komponent błędów (ZREALIZOWANE)
- `LoadingSpinner` - wskaźnik ładowania (ZREALIZOWANE)
- `Toast` - powiadomienia (ZREALIZOWANE)

---

## Szczegółowe Specyfikacje Modułów

### 1. Moduł Uwierzytelniania

#### Ekran Logowania (`/auth/login`)

**Ścieżka pliku**: `src/pages/auth/login.astro`

**Komponenty**:

```
src/components/auth/
├── LoginForm.tsx
├── AuthCard.tsx
└── AuthLayout.tsx
```

**Funkcjonalność**:

- Formularz z polami email i hasło
- Walidacja inline (format email)
- Obsługa błędów logowania
- Przekierowanie po logowaniu do `/generate`

**API Integration**:

- Supabase Auth (automatyczne przez SDK)
- Auto-logging zdarzenia logowania

**Stan komponentu**:

```typescript
interface LoginState {
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  formData: { email: string; password: string };
}
```

**Komponenty shadcn/ui**:

- `Card`, `CardHeader`, `CardContent`
- `Input`, `Button`, `Label`
- `Alert` (dla błędów)

#### Ekran Rejestracji (`/auth/register`)

**Ścieżka pliku**: `src/pages/auth/register.astro`

**Komponenty**:

```
src/components/auth/
├── RegisterForm.tsx
└── [shared AuthCard.tsx, AuthLayout.tsx]
```

**Funkcjonalność**:

- Formularz z polami email, hasło, potwierdzenie hasła
- Walidacja inline (format email, zgodność haseł)
- Automatyczne logowanie po rejestracji
- Przekierowanie po rejestracji do `/generate`

**API Integration**:

- Supabase Auth (automatyczne przez SDK)
- Auto-logging zdarzenia rejestracji

**Stan komponentu**:

```typescript
interface RegisterState {
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  formData: { email: string; password: string; confirmPassword: string };
  validationErrors: Record<string, string>;
}
```

### 2. Moduł Generowania

#### Ekran Generowania (`/generate`)

**Ścieżka pliku**: `src/pages/generate.astro`

**Komponenty**:

```
src/components/generate/
├── SourceTextInput.tsx
├── GeneratedFlashcardsList.tsx
├── SourceTextDisplay.tsx
├── ManualFlashcardForm.tsx
├── FlashcardActions.tsx
└── GenerateLayout.tsx
```

**Funkcjonalność**:

1. **Wprowadzanie tekstu źródłowego**:

   - `Textarea` z limitem 1000-10000 znaków
   - Licznik znaków w czasie rzeczywistym
   - Walidacja długości tekstu

2. **Generowanie przez AI**:

   - Przycisk "Generuj fiszki"
   - Loading spinner podczas komunikacji z AI
   - Zapisanie tekstu źródłowego w bazie

3. **Prezentacja wyników**:

   - Layout dwukolumnowy: tekst źródłowy (lewa) + fiszki (prawa)
   - Lista 3-7 wygenerowanych fiszek
   - Edycja inline każdej fiszki

4. **Akcje na fiszkach**:
   - "Zatwierdź" - zapisuje w bazie, usuwa z widoku
   - "Odrzuć" - usuwa z widoku bez zapisu
   - Edycja treści front/back

**API Integration**:

- `POST /api/v1/source-texts` - zapis tekstu źródłowego
- `POST /api/v1/flashcards` - zapis zatwierdzonych fiszek
- Auto-logging: `card_created`, `ai_card_reviewed`

**Stan komponentu**:

```typescript
interface GenerateState {
  sourceText: string;
  sourceTextId: string | null;
  generatedCards: GeneratedFlashcard[];
  status: "idle" | "generating" | "error";
  error: string | null;
  mode: "input" | "review";
}

interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  status: "viewing" | "editing" | "saving";
}
```

### 3. Moduł Nauki

#### Ekran Sesji Nauki (`/learn`)

**Ścieżka pliku**: `src/pages/learn.astro`

**Komponenty**:

```
src/components/learn/
├── LearningSession.tsx
├── FlashcardViewer.tsx
├── SessionProgress.tsx
├── RatingButtons.tsx
└── SessionSummary.tsx
```

**Funkcjonalność**:

1. **Rozpoczęcie sesji**:

   - Pobranie fiszek do powtórki (algorytm SRS)
   - Wyświetlenie pierwszej fiszki (tylko front)
   - Progress bar z postępem sesji

2. **Interakcja z fiszką**:

   - Przycisk "Pokaż odpowiedź" → wyświetlenie back
   - Przyciski oceny: "Łatwe", "Trudne", "Powtórz"

3. **Przejście do kolejnej**:
   - Aktualizacja parametrów SRS
   - Następna fiszka lub komunikat końca sesji

**API Integration**:

- `GET /api/v1/flashcards` z filtrowaniem SRS
- `PATCH /api/v1/flashcards/:id` - aktualizacja parametrów SRS

**Stan komponentu**:

```typescript
interface LearningState {
  flashcards: FlashcardForReview[];
  currentIndex: number;
  status: "idle" | "loading" | "error" | "active" | "completed";
  error: string | null;
  sessionStats: SessionStats;
  cardState: "front" | "back" | "rating";
}
```

### 4. Moduł Zarządzania

#### Ekran Listy Fiszek (`/manage`)

**Ścieżka pliku**: `src/pages/manage.astro`

**Komponenty**:

```
src/components/manage/
├── FlashcardsList.tsx
├── FlashcardCard.tsx
├── EditFlashcardModal.tsx
├── DeleteFlashcardDialog.tsx
└── AddFlashcardButton.tsx
```

**Funkcjonalność**:

1. **Lista fiszek**:

   - Wyświetlenie wszystkich fiszek użytkownika
   - Lista jedna pod drugą z widocznym front/back
   - Badge ze źródłem (AI/manual)

2. **Akcje na fiszkach**:
   - "Edytuj" → modal edycji
   - "Usuń" → dialog potwierdzenia
   - "Dodaj fiszkę" → formularz

**API Integration**:

- `GET /api/v1/flashcards` - lista fiszek
- `PATCH /api/v1/flashcards/:id` - edycja
- `DELETE /api/v1/flashcards/:id` - usuwanie

**Stan komponentu**:

```typescript
interface ManageState {
  flashcards: Flashcard[];
  status: "idle" | "loading" | "error" | "loaded";
  error: string | null;
  activeAction: {
    type: "edit" | "delete" | null;
    cardId: string | null;
  };
}
```

### 5. Komponenty Wspólne

#### Layout i Nawigacja

**Komponenty**:

```
src/components/shared/
├── MainLayout.tsx (ZREALIZOWANE)
├── Navigation.tsx (ZREALIZOWANE)
├── UserMenu.tsx (ZREALIZOWANE)
└── MobileNav.tsx (optional)
```

**Funkcjonalność MainLayout**:

- Header z nawigacją
- Main content area
- Footer (opcjonalny)
- Auth context provider

**Funkcjonalność Navigation**:

- 4 główne linki: Generate, Learn, Manage, User Menu
- Aktywny stan dla aktualnej strony
- User avatar z dropdown

#### Obsługa Błędów

**Komponenty**:

```
src/components/shared/
├── ErrorBoundary.tsx (ZREALIZOWANE)
├── UniversalError.tsx (ZREALIZOWANE)
└── Toast.tsx (ZREALIZOWANE)
```

**UniversalError props**:

```typescript
interface UniversalErrorProps {
  errorType: "404" | "500" | "network" | "generic";
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}
```

---

## Implementacja - Cykl po 3 Kroki

### **BLOK 1: Fundament i Infrastruktura** ✅ **ZREALIZOWANE**

#### Krok 1: Konfiguracja podstawowej infrastruktury UI ✅

**Cel**: Przygotowanie środowiska, shadcn/ui, podstawowych typów

**Zadania**:

1. ✅ Instalacja i konfiguracja shadcn/ui w projekcie Astro
2. ✅ Konfiguracja Tailwind CSS dla komponentów
3. ✅ Utworzenie podstawowych typów TypeScript dla fiszek, użytkowników, API responses
4. ✅ Konfiguracja Supabase Auth context w React

**Pliki utworzone**:

- ✅ `src/lib/auth.tsx` - Auth helpers i context
- ✅ `src/lib/api.ts` - API client helpers
- ✅ `src/types/index.ts` - Podstawowe typy TypeScript
- ✅ `components.json` - konfiguracja shadcn/ui

**Wymagania**:

- ✅ Działające połączenie z Supabase Auth
- ✅ Skonfigurowane komponenty shadcn/ui (Button, Input, Card, Alert)

#### Krok 2: Layout główny i nawigacja ✅

**Cel**: Utworzenie głównej struktury aplikacji i nawigacji

**Zadania**:

1. ✅ Implementacja `MainLayout.tsx` z headerem, main content, footer
2. ✅ Implementacja `Navigation.tsx` z 4 głównymi linkami
3. ✅ Implementacja `UserMenu.tsx` z avatarem i opcją wylogowania
4. ✅ Konfiguracja routingu Astro dla głównych stron

**Pliki utworzone**:

- ✅ `src/components/shared/MainLayout.tsx`
- ✅ `src/components/shared/Navigation.tsx`
- ✅ `src/components/shared/UserMenu.tsx`
- ✅ `src/layouts/AppLayout.astro`

**Wymagania**:

- ✅ Działająca nawigacja między stronami
- ✅ Wyświetlanie stanu autoryzacji użytkownika

#### Krok 3: System obsługi błędów i feedback ✅

**Cel**: Uniwersalny system błędów i powiadomień

**Zadania**:

1. ✅ Implementacja `ErrorBoundary.tsx` dla React errors
2. ✅ Implementacja `UniversalError.tsx` z różnymi typami błędów
3. ✅ Implementacja `Toast.tsx` dla powiadomień sukces/error
4. ✅ Implementacja `LoadingSpinner.tsx` dla stanów ładowania

**Pliki utworzone**:

- ✅ `src/components/shared/ErrorBoundary.tsx`
- ✅ `src/components/shared/UniversalError.tsx`
- ✅ `src/components/shared/Toast.tsx`
- ✅ `src/components/shared/LoadingSpinner.tsx`

**Wymagania**:

- ✅ Działające wychwytywanie błędów React
- ✅ Uniwersalne komponenty błędów gotowe do użycia
- ✅ System powiadomień toast

---

### **Podsumowanie Bloku 1** ✅ **ZREALIZOWANE**

Po ukończeniu Bloku 1 mamy:

- ✅ Skonfigurowane środowisko z shadcn/ui i Tailwind CSS 4
- ✅ Główny layout aplikacji z nawigacją
- ✅ System autoryzacji z Supabase Auth
- ✅ Kompletny system obsługi błędów i powiadomień
- ✅ Podstawowe typy TypeScript
- ✅ Działająca strona główna z dark theme

**Stan aplikacji**: Szkielet aplikacji z działającą nawigacją, bez funkcjonalności biznesowej.

**Zależności dla następnego bloku**: Kompletna infrastruktura pozwala rozpocząć implementację modułów funkcjonalnych.

---

## **WAŻNE UWAGI TECHNICZNE**

### **Tailwind CSS 4 Konfiguracja**

- ✅ Używa nowej składni `@import "tailwindcss"` zamiast `@tailwind`
- ✅ CSS variables definiowane w `@theme` i `@theme dark`
- ✅ Nie wymaga pliku `tailwind.config.js` (usunięty)
- ✅ Wszystkie custom colors działają poprawnie

### **Astro + React Integracja**

- ✅ React komponenty używane z `client:load` w Astro
- ✅ MainLayout jako React wrapper dla stron
- ✅ AppLayout jako Astro layout dla HTML structure
- ✅ CSS variables działają w obu środowiskach

### **TypeScript Konfiguracja**

- ✅ Aliasy `@/` skonfigurowane w `tsconfig.json`
- ✅ Wszystkie pliki React mają rozszerzenie `.tsx`
- ✅ Typy zdefiniowane w `src/types/index.ts`
- ✅ Brak błędów kompilacji TypeScript

### **Supabase Integracja**

- ✅ Auth context gotowy do użycia
- ✅ API helpers zdefiniowane
- ✅ Error handling dla API calls
- ✅ Wymaga implementacji stron logowania/rejestracji

### **Następne Kroki**

1. **Blok 2**: Moduł Uwierzytelniania (Login/Register)
2. **Blok 3**: Moduł Generowania (AI + Manual)
3. **Blok 4**: Moduł Nauki (SRS Algorithm)
4. **Blok 5**: Moduł Zarządzania (CRUD Operations)

---

_Czy powyższe 3 kroki i podsumowanie są w porządku? Po zatwierdzeniu przejdę do opisu Bloku 2 (Moduł Uwierzytelniania)._
