# REST API plan

## 1. Zasoby

### 1.1 Kluczowe zasoby

1. **Fiszki (`/flashcards`)**

   - Główny zasób aplikacji
   - Pola: `id`, `user_id`, `front`, `back`, `source`, `created_at`, `updated_at`, `source_text_id`
   - Pola SRS (do dodania później): `next_review_at`, `interval`, `ease_factor`

2. **Teksty źródłowe (`/source-texts`)**

   - Przechowuje oryginalne teksty używane do generowania fiszek
   - Pola: `id`, `text_content`, `created_at`

3. **Logi zdarzeń (`/event-logs`)**
   - Śledzi kluczowe zdarzenia systemowe
   - Pola: `id`, `user_id`, `event_type`, `timestamp`, `payload`

### 1.2 Standardy nazewnictwa

- Używamy rzeczowników w liczbie mnogiej dla endpointów
- Używamy kebab-case dla nazw endpointów
- Używamy camelCase dla pól w JSON
- Używamy snake_case dla pól w bazie danych

### 1.3 Relacje między zasobami

- Jeden użytkownik może mieć wiele fiszek (1:N)
- Jeden tekst źródłowy może być użyty do wygenerowania wielu fiszek (1:N)
- Jeden użytkownik może mieć wiele logów zdarzeń (1:N)

### 1.4 Standardowy format odpowiedzi

```json
{
  "data": {
    // Dane zasobu lub tablica zasobów
  },
  "meta": {
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 20
    }
  }
}
```

## 2. Endpointy

### 2.1 Fiszki

#### GET `/api/v1/flashcards`

- Pobiera listę fiszek użytkownika
- Parametry zapytania:
  - `page` (opcjonalny, domyślnie 1)
  - `per_page` (opcjonalny, domyślnie 20)
  - `source` (opcjonalny, filtrowanie po źródle: 'ai', 'manual', 'ai-edited')
  - `sort` (opcjonalny, sortowanie po: 'created_at', 'updated_at')
  - `order` (opcjonalny, 'asc' lub 'desc')

#### POST `/api/v1/flashcards`

- Tworzy nową fiszkę
- Body:

```json
{
  "front": "string",
  "back": "string",
  "source": "manual" | "ai" | "ai-edited",
  "source_text_id": "uuid" // opcjonalny
}
```

#### GET `/api/v1/flashcards/:id`

- Pobiera szczegóły konkretnej fiszki

#### PATCH `/api/v1/flashcards/:id`

- Aktualizuje fiszkę
- Body:

```json
{
  "front": "string",
  "back": "string"
}
```

#### DELETE `/api/v1/flashcards/:id`

- Usuwa fiszkę

### 2.2 Teksty źródłowe

#### POST `/api/v1/source-texts`

- Tworzy nowy tekst źródłowy
- Body:

```json
{
  "text_content": "string"
}
```

#### GET `/api/v1/source-texts/:id`

- Pobiera szczegóły tekstu źródłowego

### 2.3 Logi zdarzeń

#### GET `/api/v1/event-logs`

- Pobiera logi zdarzeń użytkownika
- Parametry zapytania:
  - `page` (opcjonalny)
  - `per_page` (opcjonalny)
  - `event_type` (opcjonalny, filtrowanie po typie zdarzenia)
  - `start_date` (opcjonalny)
  - `end_date` (opcjonalny)

#### Logowanie zdarzeń (automatyczne)

**UWAGA**: Logi zdarzeń są tworzone automatycznie przez system, a nie przez bezpośrednie wywołania API. Nie ma endpointu POST dla event logs.

**Mechanizm logowania:**

- Logi są tworzone automatycznie w innych endpointach (np. przy tworzeniu/edycji/usuwaniu fiszek)
- Używana jest funkcja `logEvent()` wewnątrz endpointów
- Logi są zapisywane bezpośrednio do bazy danych przez Supabase Client
- RLS (Row Level Security) zapewnia, że użytkownicy mogą logować tylko swoje zdarzenia

**Przykłady automatycznego logowania:**

```typescript
// Przy tworzeniu fiszki ręcznej
await logEvent({
  userId: authContext.userId,
  eventType: "manual_card_created",
  payload: { flashcardId: flashcard.id },
});

// Przy edycji fiszki
await logEvent({
  userId: authContext.userId,
  eventType: "card_edited",
  payload: {
    flashcardId: flashcard.id,
    changedFields: ["front", "back"],
  },
});

// Przy usuwaniu fiszki
await logEvent({
  userId: authContext.userId,
  eventType: "card_deleted",
  payload: { flashcardId: flashcard.id },
});
```

**Typy zdarzeń:**

- `ai_card_created` - utworzono fiszkę przez AI
- `ai_edited_card_created` - utworzono fiszkę edytowaną przez AI
- `manual_card_created` - utworzono fiszkę ręcznie
- `card_edited` - edytowano fiszkę
- `card_deleted` - usunięto fiszkę
- `ai_card_reviewed` - przejrzano fiszkę AI

### 2.4 Wersjonowanie API

- Używamy wersjonowania w URL (`/api/v1/`)
- Zmiana wersji przy istotnych zmianach w API
- Dokumentacja zmian między wersjami

### 2.5 Obsługa błędów

Standardowy format odpowiedzi błędu:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {} // opcjonalne dodatkowe informacje
  }
}
```

Kody statusu HTTP:

- 200: Sukces
- 201: Utworzono
- 400: Błędne żądanie
- 401: Brak autoryzacji
- 403: Brak uprawnień
- 404: Nie znaleziono
- 422: Błąd walidacji
- 500: Błąd serwera

### 2.6 Optymalizacja

- Cache'owanie odpowiedzi GET (max-age: 60s)
- Paginacja dla list zasobów
- Agregacja danych w odpowiedziach
- Kompresja odpowiedzi (gzip)

### 2.7 CORS

```json
{
  "Access-Control-Allow-Origin": "https://10xcards.com",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

### 2.8 Rate Limiting

- 100 żądań na minutę na użytkownika
- 1000 żądań na godzinę na użytkownika
- Nagłówki odpowiedzi:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## 3. Uwierzytelnianie i autoryzacja

### 3.1 Mechanizm uwierzytelniania

- Wykorzystanie Supabase Auth
- JWT token w nagłówku `Authorization: Bearer <token>`
- Odświeżanie tokenu przez Supabase SDK

### 3.2 Zarządzanie tokenami

- Tokeny JWT z 1-godzinną ważnością
- Automatyczne odświeżanie tokenów przez Supabase SDK
- Bezpieczne przechowywanie tokenów w pamięci aplikacji

### 3.3 Role i uprawnienia

- `authenticated`: Podstawowy użytkownik
  - Pełny dostęp do własnych fiszek
  - Pełny dostęp do własnych logów
  - Ograniczony dostęp do tekstów źródłowych

### 3.4 Zabezpieczenia

- HTTPS wymagany
- Nagłówki bezpieczeństwa:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Content-Security-Policy`
- Walidacja danych wejściowych
- Sanityzacja danych wyjściowych

### 3.5 Obsługa sesji

- Sesje zarządzane przez Supabase Auth
- Automatyczne wylogowanie po 24h nieaktywności
- Możliwość wylogowania przez endpoint `/auth/v1/logout`

## 4. Walidacja i logika biznesowa

### 4.1 Walidacja danych

- Walidacja długości pól:
  - `front`: max 250 znaków
  - `back`: max 750 znaków
  - `text_content`: max 10000 znaków
- Walidacja typów danych
- Walidacja wymaganych pól
- Walidacja formatu UUID

### 4.2 Reguły biznesowe

- Fiszki mogą być tworzone tylko przez zalogowanych użytkowników
- Użytkownik może modyfikować tylko swoje fiszki
- Teksty źródłowe są powiązane z fiszkami AI
- Logi zdarzeń są tworzone automatycznie

### 4.3 Implementacja logiki biznesowej

- Middleware do walidacji i autoryzacji
- Serwisy do obsługi logiki biznesowej
- Transakcje bazodanowe dla operacji atomowych

### 4.4 Integracja z Supabase

- Wykorzystanie Supabase Client SDK
- Wykorzystanie Supabase Edge Functions dla złożonej logiki
- Wykorzystanie Supabase Realtime dla powiadomień

### 4.5 Testowanie

- Testy jednostkowe dla logiki biznesowej
- Testy integracyjne dla endpointów API
- Testy wydajnościowe dla krytycznych ścieżek

### 4.6 Logowanie i monitorowanie

- Logowanie wszystkich żądań API
- Monitorowanie wydajności endpointów
- Śledzenie błędów i wyjątków
- Metryki użycia API

### 4.7 Obsługa błędów

- Centralny handler błędów
- Logowanie błędów do Supabase
- Powiadomienia o krytycznych błędach
- Automatyczne raportowanie błędów
