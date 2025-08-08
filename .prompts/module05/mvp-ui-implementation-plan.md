# Plan Implementacji UI - MVP 10xCards

## A. Podsumowanie głównych założeń

### Zakres MVP

MVP obejmuje **4 główne moduły funkcjonalne** obsługujące pełny cykl życia fiszki:

1. **Uwierzytelnianie** - rejestracja, logowanie, podstawowa nawigacja
2. **Generowanie** - AI generation, edycja, ręczne tworzenie fiszek
3. **Nauka** - sesja powtórek z algorytmem SRS
4. **Zarządzanie** - przeglądanie, edycja, usuwanie zapisanych fiszek

### Stack technologiczny

- **Frontend**: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui
- **Backend**: Supabase (BaaS, PostgreSQL, Auth)
- **AI**: Openrouter.ai dla generowania fiszek
- **Hosting**: DigitalOcean + Docker + GitHub Actions

### Kluczowe założenia UX

- **Desktop-first** - MVP skupia się na wersji desktopowej
- **Inline validation** - walidacja formularzy w czasie rzeczywistym
- **Error feedback** - uniwersalny system obsługi błędów
- **Loading states** - jasne wskaźniki ładowania dla wszystkich operacji

## B. Scenariusze użytkownika (User Flows)

### 1. Scenariusz: Onboarding użytkownika

**Punkt początkowy**: Niezalogowany użytkownik wchodzi na stronę aplikacji

**Przebieg**:

1. **Strona główna/przekierowanie** → Ekran logowania (`/auth/login`)
2. **Rejestracja nowego użytkownika**:
   - Przejście do `/auth/register` przez link
   - Wypełnienie formularza (email, hasło, potwierdzenie hasła)
   - Walidacja inline (format email, zgodność haseł)
   - Automatyczne logowanie po rejestracji
3. **Logowanie istniejącego użytkownika**:
   - Wypełnienie formularza logowania
   - Walidacja danych
4. **Przekierowanie** → Moduł Generowania (`/generate`) jako domyślny widok

**Rola użytkownika**: Gość → Zarejestrowany użytkownik

**Integracje zewnętrzne**:

- **Supabase Auth** - automatyczna obsługa rejestracji/logowania
- **Supabase Database** - tworzenie profilu użytkownika

**Kluczowe decyzje UX**:

- Moduł Generowania jako landing page po logowaniu (główna wartość produktu)
- Automatyczne logowanie po rejestracji (redukcja friction)
- Inline validation dla lepszego UX formularzy

**Powiązane ekrany/komponenty**:

- `LoginForm`, `RegisterForm`, `NavigationMenu`
- `Input`, `Button`, `Alert`, `Card`, `Label`

**Główne akcje i API**:

- `POST /auth/register` (Supabase Auth)
- `POST /auth/login` (Supabase Auth)
- Auto-logging zdarzeń rejestracji/logowania

**Feedback i obsługa błędów**:

- `Alert` component dla błędów logowania/rejestracji
- Loading states w przyciskach podczas procesowania
- Validation messages pod polami formularza

---

### 2. Scenariusz: Generowanie fiszek przez AI

**Punkt początkowy**: Zalogowany użytkownik w Module Generowania (`/generate`)

**Przebieg**:

1. **Wprowadzanie tekstu**:
   - Wklejenie tekstu źródłowego do `Textarea` (1000-10000 znaków)
   - Licznik znaków w czasie rzeczywistym (`Badge`)
   - Walidacja długości tekstu
2. **Generowanie przez AI**:
   - Kliknięcie przycisku "Generuj fiszki"
   - `Spinner` podczas komunikacji z AI
   - Zapisanie tekstu źródłowego w bazie
3. **Prezentacja wyników**:
   - Layout dwukolumnowy: tekst źródłowy (lewa) + lista fiszek (prawa)
   - `SourceTextDisplay` z oryginalnym tekstem
   - `GeneratedFlashcardsList` z 3-7 wygenerowanymi fiszkami
4. **Recenzja i zatwierdzanie**:
   - Edycja inline każdej fiszki (`Textarea` dla front/back)
   - Przycisk "Zatwierdź" - zapisuje w bazie, usuwa z widoku
   - Przycisk "Odrzuć" - usuwa z widoku bez zapisu

**Rola użytkownika**: Zalogowany użytkownik (główny flow produktu)

**Integracje zewnętrzne**:

- **Openrouter.ai** - generowanie fiszek z tekstu
- **Supabase Database** - zapis tekstów źródłowych i fiszek

**Kluczowe decyzje UX**:

- Dwukolumnowy layout dla kontekstu (tekst źródłowy widoczny podczas recenzji)
- Edycja inline bez przełączania trybów
- Pojedyncze akcje na fiszkę (Zatwierdź/Odrzuć) zamiast batch operations

**Powiązane ekrany/komponenty**:

- `Textarea`, `Button`, `Card`, `Label`, `Badge`, `Spinner`
- `SourceTextDisplay`, `GeneratedFlashcardsList`
- `Alert` dla błędów generowania

**Główne akcje i API**:

- `POST /api/v1/source-texts` - zapis tekstu źródłowego
- `POST /api/v1/flashcards` - zapis zatwierdzonych fiszek
- `POST /api/v1/event-logs` - auto-logging zdarzeń (card_created, ai_card_reviewed)

**Feedback i obsługa błędów**:

- Loading spinner podczas generowania (może trwać kilka sekund)
- Alert przy błędach komunikacji z AI
- Toast notifications przy zatwierdzaniu fiszek
- UniversalError dla błędów 500/network

---

### 3. Scenariusz: Ręczne tworzenie fiszek

**Punkt początkowy**: Użytkownik w Module Generowania (`/generate`)

**Przebieg**:

1. **Inicjacja**:
   - Kliknięcie przycisku "+ Dodaj fiszkę" (`ManualFlashcardForm`)
   - Pojawienie się nowej karty z pustymi polami
2. **Wypełnianie**:
   - Edycja pól front/back (`Textarea`)
   - Walidacja wymaganych pól
3. **Zapisanie**:
   - Przycisk "Zapisz" - zapisuje w bazie z `source: manual`
   - Przycisk "Anuluj" - usuwa z widoku

**Rola użytkownika**: Zalogowany użytkownik (alternatywny flow)

**Integracje zewnętrzne**:

- **Supabase Database** - zapis ręcznych fiszek

**Kluczowe decyzje UX**:

- Integracja z przepływem generowania AI (ten sam interfejs)
- Możliwość miksowania ręcznych i AI fiszek w jednej sesji

**Powiązane ekrany/komponenty**:

- `ManualFlashcardForm`, `Textarea`, `Button`, `Card`

**Główne akcje i API**:

- `POST /api/v1/flashcards` z `source: manual`
- Auto-logging `card_created` z `source: manual`

**Feedback i obsługa błędów**:

- Inline validation dla wymaganych pól
- Toast notification po zapisaniu
- Alert przy błędach zapisu

---

### 4. Scenariusz: Sesja nauki z algorytmem SRS

**Punkt początkowy**: Użytkownik przechodzi do Modułu Nauki (`/learn`)

**Przebieg**:

1. **Rozpoczęcie sesji**:
   - System pobiera fiszki do powtórki (SRS algorithm)
   - Wyświetlenie pierwszej fiszki (tylko front)
   - `Progress` bar z postępem sesji
2. **Interakcja z fiszką**:
   - Przycisk "Pokaż odpowiedź" → wyświetlenie back
   - Przyciski oceny: "Łatwe", "Trudne", "Powtórz"
3. **Przejście do kolejnej**:
   - Aktualizacja parametrów SRS (next_review_at, interval, ease_factor)
   - Następna fiszka lub komunikat końca sesji
4. **Zakończenie**:
   - `Alert` z podsumowaniem sesji

**Rola użytkownika**: Zalogowany użytkownik z zapisanymi fiszkami

**Integracje zewnętrzne**:

- **Supabase Database** - odczyt/aktualizacja parametrów SRS

**Kluczowe decyzje UX**:

- Skupienie na pojedynczej fiszce (bez dystrakcji)
- Jasny podział: pokazywanie frontu → pokazywanie back → ocena
- Progress indicator dla motywacji

**Powiązane ekrany/komponenty**:

- `Card`, `Button`, `Progress`, `Badge`, `Alert`

**Główne akcje i API**:

- `GET /api/v1/flashcards` z filtrowaniem SRS
- `PATCH /api/v1/flashcards/:id` - aktualizacja parametrów SRS

**Feedback i obsługa błędów**:

- Progress bar ze stanem sesji
- Alert przy braku fiszek do powtórki
- UniversalError przy błędach ładowania

---

### 5. Scenariusz: Zarządzanie zapisanymi fiszkami

**Punkt początkowy**: Użytkownik w Module Zarządzania (`/manage`)

**Przebieg**:

1. **Przeglądanie listy**:
   - Wyświetlenie wszystkich fiszek użytkownika (`FlashcardCard`)
   - Lista jedna pod drugą z front/back visible
   - `Badge` ze źródłem (AI/manual)
2. **Edycja fiszki**:
   - Przycisk "Edytuj" → `EditFlashcardModal`
   - Edycja w modal dialog
   - Zapisanie zmian
3. **Usuwanie fiszki**:
   - Przycisk "Usuń" → `DeleteFlashcardDialog`
   - Potwierdzenie w alert dialog
   - Trwałe usunięcie
4. **Dodawanie nowej**:
   - Przycisk "Dodaj fiszkę" na górze listy

**Rola użytkownika**: Zalogowany użytkownik (maintenance workflow)

**Integracje zewnętrzne**:

- **Supabase Database** - CRUD operations na fiszkach

**Kluczowe decyzje UX**:

- Lista zamiast grid layout (lepsze dla dłuższych tekstów)
- Modal dialogs dla edycji (oddzielenie od głównego widoku)
- Confirmation dialogs dla destruktywnych akcji

**Powiązane ekrany/komponenty**:

- `FlashcardCard`, `EditFlashcardModal`, `DeleteFlashcardDialog`
- `Dialog`, `AlertDialog`, `Textarea`, `Button`

**Główne akcje i API**:

- `GET /api/v1/flashcards` - lista fiszek
- `PATCH /api/v1/flashcards/:id` - edycja
- `DELETE /api/v1/flashcards/:id` - usuwanie
- Auto-logging edycji i usuwania

**Feedback i obsługa błędów**:

- Loading state podczas ładowania listy
- Toast notifications po operacjach
- Confirmation dialogs z clear messaging
- UniversalError dla błędów API

---

## C. Ogólny podział na moduły i globalne funkcje UI

### Architektura modułów

```
┌─────────────────────────────────────────────────────┐
│                    Layout                           │
│  ┌───────────────────────────────────────────────┐  │
│  │              NavigationMenu                   │  │
│  │  [Generate] [Learn] [Manage] [Avatar+Logout] │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │                Main Content                   │  │
│  │              (Module Content)                 │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │          Global Components                    │  │
│  │    [Toast] [Modal] [ErrorBoundary]           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Nawigacja główna

- **4 główne sekcje**: Generate (default), Learn, Manage, User Menu
- **Stany active** dla aktualnej strony
- **User Avatar** z dropdown do wylogowania
- **Breadcrumbs** nie są potrzebne w MVP (płaska struktura)

### Globalne funkcje dostępne z każdego miejsca

#### 1. Error Handling System

- **ErrorBoundary** - catch wszystkich błędów React
- **UniversalError** - uniwersalny komponent błędów:
  - 404 - niezgodne route
  - 500 - błędy serwera
  - network - problemy z połączeniem
  - generic - inne błędy
- **Integration points**: wszystkie API calls, routing

#### 2. Toast Notification System

- **Success toasts**: zapisano fiszkę, usunięto fiszkę
- **Error toasts**: błędy operacji, timeouts
- **Auto-hide**: 3-5 sekund
- **Pozycjonowanie**: top-right corner

#### 3. Loading States Management

- **LoadingSpinner** - dla długich operacji (AI generation)
- **Button loading states** - dla form submissions
- **Skeleton loading** - nie w MVP (optional enhancement)

#### 4. Modal System

- **Focus trap** - keyboard navigation
- **Escape key** - zamykanie
- **Click outside** - zamykanie
- **Usage**: edycja fiszek, potwierdzenia usuwania

#### 5. Form Validation System

- **Inline validation** - real-time feedback
- **FormValidation component** - konsystentne error messages
- **Integration**: wszystkie formularze w aplikacji

### Responsywność w MVP

- **Desktop-first approach** - MVP nie obejmuje mobile optimization
- **Minimum viewport**: 1024px width
- **Flexbox/Grid layouts** przygotowane do przyszłej responsywności

### Accessibility (A11y) w MVP

- **Podstawowe wymagania WCAG**:
  - Keyboard navigation dla wszystkich interakcji
  - Focus management w modalach
  - Screen reader support (semantic HTML)
  - Color contrast compliance
- **Advanced a11y** - post-MVP enhancement

### Stan globalny

- **Authentication state** - Supabase Auth context
- **User session** - automatyczne zarządzanie tokenami
- **Error state** - globalny error handler
- **Loading state** - per-component basis (no global loader)

### Integracje zewnętrzne w UI

#### Supabase Auth Integration

- **Auto-redirect** - niezalogowani → `/auth/login`
- **Session management** - automatyczne token refresh
- **Logout flow** - wyczyść state + redirect

#### Openrouter.ai Integration

- **Loading states** - podczas generowania (może trwać 10-30s)
- **Error handling** - timeout, rate limits, API errors
- **Retry mechanism** - user-initiated retry dla failed generations

#### Database Integration (Supabase)

- **Optimistic updates** - nie w MVP (może powodować complexity)
- **Error recovery** - retry strategies dla failed saves
- **Offline handling** - nie w MVP

---

## Podsumowanie implementacji

### Priorytet implementacji (suggested order):

1. **Podstawowy Layout + Navigation** (wspólna infrastruktura)
2. **Authentication Module** (blokuje dalsze funkcje)
3. **Shared Components** (Button, Input, Card, itp.)
4. **Generate Module** (główna wartość produktu)
5. **Manage Module** (CRUD dla fiszek)
6. **Learn Module** (SRS algorithm)
7. **Error Handling + Toast System** (polish UX)

### Kluczowe dependencies między modułami:

- **Authentication** → wszystkie inne moduły
- **Shared Components** → wszystkie feature modules
- **Database schemas** → wszystkie CRUD operations
- **Error System** → wszystkie API integrations

### MVP Success Criteria (z perspektywy UI):

- ✅ Użytkownik może wykonać pełny flow: register → generate → approve → learn → manage
- ✅ Wszystkie operacje mają clear feedback (loading, success, error)
- ✅ Aplikacja jest stabilna i używalna na desktop
- ✅ AI generation flow jest intuitive i efektywny
