# Prompt do implementacji endpointów REST API

## Kontekst projektu

Jesteś ekspertem w implementacji REST API w TypeScript z wykorzystaniem Supabase. Twój cel to systematyczne implementowanie endpointów zgodnie z najlepszymi praktykami, krok po kroku, z możliwością feedbacku po każdej sekwencji.

## Tech Stack projektu

- **Backend**: Supabase (PostgreSQL + TypeScript SDK)
- **Frontend**: Astro 5 + React 19 + TypeScript 5
- **Styling**: Tailwind 4 + Shadcn/ui
- **Hosting**: DigitalOcean + Docker
- **CI/CD**: GitHub Actions

## Struktura projektu

Projekt używa Supabase jako Backend-as-a-Service. Klient Supabase jest już skonfigurowany w `src/db/supabase.client.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);
```

## Zadanie

Zaimplementuj endpoint REST API zgodnie z następującymi wymaganiami:

**Endpoint do implementacji**: `[PODAJ ENDPOINT]`

**Przykład**: `GET /api/v1/flashcards` lub `POST /api/v1/flashcards` lub `PUT /api/v1/flashcards/:id`

## Plan implementacji (3 sekwencje po 3 kroki)

### Sekwencja 1: Podstawowa struktura i walidacja

1. **Analiza wymagań** - Określenie funkcjonalności, parametrów, odpowiedzi
2. **Definicja typów TypeScript** - Interfejsy dla request/response, walidacja
3. **Podstawowa implementacja endpointu** - Routing, podstawowa logika biznesowa

### Sekwencja 2: Integracja z bazą danych i obsługa błędów

4. **Integracja z Supabase** - Zapytania do bazy danych, operacje CRUD
5. **Obsługa błędów** - Strukturyzowane błędy, HTTP status codes
6. **Walidacja danych** - Walidacja input/output, sanitizacja

### Sekwencja 3: Testy i dokumentacja

7. **Testy jednostkowe** - Testy logiki biznesowej, walidacji
8. **Testy integracyjne** - Testy z bazą danych, endpoint testing
9. **Dokumentacja API** - OpenAPI/Swagger specyfikacja

## Wymagania implementacyjne

### Architektura

- Użyj **Edge Functions** Supabase lub **API Routes** w Astro
- Zastosuj **Repository Pattern** dla operacji bazodanowych
- Implementuj **Service Layer** dla logiki biznesowej
- Użyj **Zod** do walidacji schematów

### Bezpieczeństwo

- Walidacja wszystkich inputów
- Sanityzacja danych
- Rate limiting (podstawowy)
- CORS configuration

### Wydajność

- Paginacja dla list endpointów
- Podstawowe caching (ETag, Cache-Control)
- Optymalizacja zapytań SQL

### Jakość kodu

- TypeScript strict mode
- ESLint + Prettier
- Consistent error handling
- Logging dla debugowania

### Testy

- Unit tests (Jest/Vitest)
- Integration tests
- Test coverage > 80%

## Format pracy

### Po każdej sekwencji (3 kroki):

1. **Podsumowanie wykonanych kroków** - Co zostało zaimplementowane
2. **Kod implementacji** - Kompletny kod z komentarzami
3. **Prośba o feedback** - "Czy implementacja spełnia oczekiwania? Czy można kontynuować?"

### Przed każdą sekwencją:

1. **Plan kolejnych 3 kroków** - Szczegółowy opis co będzie zrobione
2. **Prośba o akceptację** - "Czy plan jest odpowiedni? Czy można przystąpić do implementacji?"

## Struktura plików do utworzenia

```
src/
├── api/
│   └── v1/
│       └── [endpoint]/
│           ├── index.ts          # Główny endpoint
│           ├── types.ts          # TypeScript interfaces
│           ├── validation.ts     # Zod schemas
│           ├── service.ts        # Business logic
│           ├── repository.ts     # Database operations
│           └── tests/
│               ├── unit.test.ts
│               └── integration.test.ts
├── lib/
│   ├── errors.ts                 # Error handling utilities
│   ├── validation.ts             # Common validation helpers
│   └── database.ts               # Database utilities
└── types/
    └── api.ts                    # Shared API types
```

## Przykładowe elementy do uwzględnienia

### Dla GET endpointów:

- Paginacja (page, per_page)
- Filtrowanie (query parameters)
- Sortowanie (sort, order)
- Response caching

### Dla POST/PUT endpointów:

- Request body validation
- Conflict handling
- Optimistic updates
- Response status codes

### Dla DELETE endpointów:

- Soft delete vs hard delete
- Cascade handling
- Confirmation mechanisms

## Instrukcje dla LLM

1. **Zacznij od analizy** - Określ dokładnie co ma robić endpoint
2. **Proponuj strukturę** - Zgodnie z best practices
3. **Implementuj krok po kroku** - Zatrzymuj się po każdej sekwencji
4. **Czekaj na feedback** - Nie kontynuuj bez akceptacji
5. **Dostosowuj się** - Modyfikuj plan na podstawie feedbacku
6. **Dokumentuj** - Komentarze w kodzie, README, API docs

## Pytania przed rozpoczęciem

1. **Endpoint**: Jaki dokładnie endpoint mam zaimplementować?
2. **Funkcjonalność**: Jakie operacje ma wykonywać (CRUD)?
3. **Dane**: Jakie dane ma obsługiwać (struktura, relacje)?
4. **Specjalne wymagania**: Czy są jakieś szczególne wymagania biznesowe?

## Przykład implementacji

Oto przykład wysokiej jakości implementacji endpointu GET `/api/v1/flashcards`:

### 1. Analiza wymagań

- Endpoint zwraca listę fiszek użytkownika
- Wspiera paginację, filtrowanie, sortowanie
- Wymaga autoryzacji (na razie pomijamy)
- Zwraca dane w formacie JSON z metadanymi

### 2. Typy TypeScript

```typescript
// types.ts
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  source: "ai" | "manual" | "ai-edited";
  sourceTextId?: string;
  createdAt: string;
  updatedAt: string;
  easeFactor?: number;
  interval?: number;
  nextReviewAt?: string;
}

export interface FlashcardQuery {
  page?: number;
  per_page?: number;
  source?: string;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
}

export interface ApiResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}
```

### 3. Walidacja (Zod)

```typescript
// validation.ts
import { z } from "zod";

export const FlashcardQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, "Page must be a positive integer"),
  per_page: z
    .string()
    .optional()
    .default("20")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, "Per page must be between 1 and 100"),
  source: z.enum(["ai", "manual", "ai-edited"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
```

### 4. Repository Pattern

```typescript
// repository.ts
import { supabaseClient } from "../../../db/supabase.client";
import type { Flashcard, FlashcardQuery } from "./types";

export class FlashcardRepository {
  async findAll(
    userId: string,
    query: FlashcardQuery
  ): Promise<{
    data: Flashcard[];
    count: number;
  }> {
    const {
      page = 1,
      per_page = 20,
      source,
      sort = "created_at",
      order = "desc",
    } = query;

    let supabaseQuery = supabaseClient
      .from("flashcards")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (source) {
      supabaseQuery = supabaseQuery.eq("source", source);
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, count, error } = await supabaseQuery
      .order(sort, { ascending: order === "asc" })
      .range(from, to);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
    };
  }
}
```

### 5. Service Layer

```typescript
// service.ts
import { FlashcardRepository } from "./repository";
import { FlashcardQuery, ApiResponse, Flashcard } from "./types";

export class FlashcardService {
  private repository: FlashcardRepository;

  constructor() {
    this.repository = new FlashcardRepository();
  }

  async getFlashcards(
    userId: string,
    query: FlashcardQuery
  ): Promise<ApiResponse<Flashcard>> {
    const { data, count } = await this.repository.findAll(userId, query);

    const { page = 1, per_page = 20 } = query;

    return {
      data,
      meta: {
        pagination: {
          total: count,
          page,
          per_page,
        },
      },
    };
  }
}
```

### 6. Główny endpoint

```typescript
// index.ts
import type { APIRoute } from "astro";
import { FlashcardService } from "./service";
import { FlashcardQuerySchema } from "./validation";
import type { Flashcard } from "./types";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = FlashcardQuerySchema.parse(queryParams);

    // For now, use a default user ID (will be replaced with auth later)
    const userId = "default-user-id";

    const service = new FlashcardService();
    const result = await service.getFlashcards(userId, validatedQuery);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch flashcards",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
```

## Instrukcje końcowe

**Gotowy do rozpoczęcia implementacji! Podaj endpoint, który mam zaimplementować, a rozpocznę pracę zgodnie z powyższym planem.**

Pamiętaj:

- Zatrzymuj się po każdej sekwencji (3 kroki)
- Czekaj na feedback przed kontynuacją
- Dostosowuj implementację do specyficznych wymagań projektu
- Używaj TypeScript strict mode
- Implementuj proper error handling
- Dodawaj testy dla każdej funkcjonalności
