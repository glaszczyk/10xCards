# Plan Implementacji Endpointa GET `/api/v1/source-texts/:id`

## Przegląd

Endpoint pobiera szczegóły konkretnego tekstu źródłowego z informacjami o powiązanych fiszkach.

## Specyfikacja API

### Podstawowe informacje

```json
{
  "endpoint": "/api/v1/source-texts/:id",
  "method": "GET",
  "requestSchema": {
    "params": {
      "id": "UUID string (required)"
    }
  },
  "responseSchema": "ApiResponse<SourceTextWithFlashcardsDto>",
  "authentication": "Bearer JWT Token",
  "rateLimit": "100 requests/minute per user"
}
```

### Parametry ścieżki

- **id** (string, required): UUID tekstu źródłowego do pobrania

### Schemat odpowiedzi

```typescript
{
  "data": {
    "id": "string",
    "textContent": "string",
    "createdAt": "string (ISO 8601)",
    "flashcards": [
      {
        "id": "string",
        "front": "string",
        "back": "string",
        "source": "ai | ai-edited",
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)"
      }
    ],
    "flashcardCount": "number"
  }
}
```

## Kroki implementacji

### 1. **Walidacja i autoryzacja**

- Sprawdzenie obecności i ważności tokenu JWT
- Pobranie `userId` z tokenu za pomocą Supabase Auth
- Walidacja parametru `id` jako poprawny UUID

### 2. **Zapytanie do bazy danych**

- Pobranie source text z tabeli `source_texts`
- Sprawdzenie czy source text istnieje
- Pobranie powiązanych fiszek z tabeli `flashcards`

### 3. **Mapowanie danych**

- Konwersja danych z bazy na DTO response
- Mapowanie powiązanych fiszek
- Liczenie statystyk

### 4. **Zwrócenie odpowiedzi**

- Status 200 z danymi source text i powiązanymi fiszkami
- Cache headers z ETag (max-age: 300s)

## Implementacja

```typescript
app.get("/api/v1/source-texts/:id", async (req: Request, res: Response) => {
  try {
    // 1. Autoryzacja i walidacja
    const authContext = await authenticateUser(req);
    const sourceTextId = validateUUID(req.params.id);

    // 2. Pobranie source text z bazy
    const { data: sourceText, error: sourceTextError } = await supabase
      .from("source_texts")
      .select("*")
      .eq("id", sourceTextId)
      .single();

    if (sourceTextError || !sourceText) {
      throw new SourceTextNotFoundError(sourceTextId);
    }

    // 3. Pobranie powiązanych fiszek
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at")
      .eq("source_text_id", sourceTextId)
      .eq("user_id", authContext.userId) // Bezpieczeństwo - tylko fiszki użytkownika
      .order("created_at", { ascending: false });

    if (flashcardsError) {
      throw new DatabaseError("Failed to fetch related flashcards");
    }

    // 4. Mapowanie odpowiedzi
    const responseData: SourceTextWithFlashcardsDto = {
      id: sourceText.id,
      textContent: sourceText.text_content,
      createdAt: sourceText.created_at,
      flashcards: (flashcards || []).map((fc) => ({
        id: fc.id,
        front: fc.front,
        back: fc.back,
        source: fc.source as FlashcardSource,
        createdAt: fc.created_at,
        updatedAt: fc.updated_at,
      })),
      flashcardCount: flashcards?.length || 0,
    };

    const response: ApiResponse<SourceTextWithFlashcardsDto> = {
      data: responseData,
    };

    // 5. Cache headers
    res.setHeader("Cache-Control", "max-age=300");
    res.setHeader("ETag", generateETag(responseData));

    res.status(200).json(response);
  } catch (error) {
    await handleApiError(error, res, {
      userId: req.user?.id,
      endpoint: "GET /api/v1/source-texts/:id",
      sourceTextId: req.params.id,
    });
  }
});
```

## Obsługa błędów

### Definicje błędów

```typescript
export class SourceTextNotFoundError extends Error {
  constructor(sourceTextId: string) {
    super(`Source text with id ${sourceTextId} not found`);
    this.name = "SourceTextNotFoundError";
  }
}

export class InvalidUUIDError extends Error {
  constructor(value: string) {
    super(`Invalid UUID format: ${value}`);
    this.name = "InvalidUUIDError";
  }
}
```

### Mapowanie błędów na kody HTTP

```typescript
const errorMapping = [
  { type: "UnauthorizedError", status: 401, code: "UNAUTHORIZED" },
  { type: "InvalidUUIDError", status: 400, code: "INVALID_UUID" },
  {
    type: "SourceTextNotFoundError",
    status: 404,
    code: "SOURCE_TEXT_NOT_FOUND",
  },
  { type: "DatabaseError", status: 500, code: "DATABASE_ERROR" },
  { type: "RateLimitError", status: 429, code: "RATE_LIMIT_EXCEEDED" },
];
```

## Funkcje pomocnicze

### Walidacja UUID

```typescript
const validateUUID = (value: string): string => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new InvalidUUIDError(value);
  }

  return value;
};
```

### Generowanie ETag

```typescript
const generateETag = (data: SourceTextWithFlashcardsDto): string => {
  const hash = createHash("md5");
  hash.update(
    JSON.stringify({
      id: data.id,
      textContent: data.textContent,
      flashcardCount: data.flashcardCount,
      lastUpdated: data.flashcards[0]?.updatedAt || data.createdAt,
    })
  );
  return `"${hash.digest("hex")}"`;
};
```

## Przykłady użycia

### Przykład 1: Pomyślne pobranie source text z fiszkami

```bash
curl -X GET http://localhost:3000/api/v1/source-texts/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i pozwala na tworzenie komponentów wielokrotnego użytku.",
    "createdAt": "2024-01-15T10:30:00Z",
    "flashcards": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "front": "Co to jest React?",
        "back": "React to biblioteka JavaScript do budowania interfejsów użytkownika",
        "source": "ai",
        "createdAt": "2024-01-15T10:35:00Z",
        "updatedAt": "2024-01-15T10:35:00Z"
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "front": "Kto stworzył React?",
        "back": "Facebook (Meta)",
        "source": "ai-edited",
        "createdAt": "2024-01-15T10:35:00Z",
        "updatedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "flashcardCount": 2
  }
}
```

### Przykład 2: Source text bez fiszek

```bash
curl -X GET http://localhost:3000/api/v1/source-texts/789e0123-e89b-12d3-a456-426614174003 \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174003",
    "textContent": "Nowy tekst bez fiszek",
    "createdAt": "2024-01-15T12:00:00Z",
    "flashcards": [],
    "flashcardCount": 0
  }
}
```

### Przykład 3: Source text nie znaleziony

```bash
curl -X GET http://localhost:3000/api/v1/source-texts/nonexistent-id \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "SOURCE_TEXT_NOT_FOUND",
    "message": "Source text with id nonexistent-id not found"
  }
}
```

### Przykład 4: Nieprawidłowy UUID

```bash
curl -X GET http://localhost:3000/api/v1/source-texts/invalid-uuid \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "Invalid UUID format: invalid-uuid"
  }
}
```

## Testy

### 1. Testy jednostkowe

```typescript
describe("GET /api/v1/source-texts/:id", () => {
  test("should return source text with flashcards", async () => {
    const sourceTextId = "456e7890-e89b-12d3-a456-426614174001";

    const mockSourceText = {
      id: sourceTextId,
      text_content: "Test source text",
      created_at: "2024-01-15T10:30:00Z",
    };

    const mockFlashcards = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        front: "Test question",
        back: "Test answer",
        source: "ai",
        created_at: "2024-01-15T10:35:00Z",
        updated_at: "2024-01-15T10:35:00Z",
      },
    ];

    mockSupabase.from.mockImplementation((table) => {
      if (table === "source_texts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockSourceText, error: null }),
            }),
          }),
        };
      } else if (table === "flashcards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest
                  .fn()
                  .mockResolvedValue({ data: mockFlashcards, error: null }),
              }),
            }),
          }),
        };
      }
    });

    const response = await request(app)
      .get(`/api/v1/source-texts/${sourceTextId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.id).toBe(sourceTextId);
    expect(response.body.data.textContent).toBe("Test source text");
    expect(response.body.data.flashcards).toHaveLength(1);
    expect(response.body.data.flashcardCount).toBe(1);
  });

  test("should return source text with empty flashcards array", async () => {
    const sourceTextId = "456e7890-e89b-12d3-a456-426614174001";

    const mockSourceText = {
      id: sourceTextId,
      text_content: "Test source text",
      created_at: "2024-01-15T10:30:00Z",
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === "source_texts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockSourceText, error: null }),
            }),
          }),
        };
      } else if (table === "flashcards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
    });

    const response = await request(app)
      .get(`/api/v1/source-texts/${sourceTextId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.flashcards).toEqual([]);
    expect(response.body.data.flashcardCount).toBe(0);
  });

  test("should return 404 for non-existent source text", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    await request(app)
      .get("/api/v1/source-texts/456e7890-e89b-12d3-a456-426614174001")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(404);
  });

  test("should return 400 for invalid UUID", async () => {
    await request(app)
      .get("/api/v1/source-texts/invalid-uuid")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(400);
  });

  test("should include cache headers", async () => {
    const sourceTextId = "456e7890-e89b-12d3-a456-426614174001";

    const mockSourceText = {
      id: sourceTextId,
      text_content: "Test source text",
      created_at: "2024-01-15T10:30:00Z",
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === "source_texts") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockSourceText, error: null }),
            }),
          }),
        };
      } else if (table === "flashcards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
    });

    const response = await request(app)
      .get(`/api/v1/source-texts/${sourceTextId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.headers["cache-control"]).toBe("max-age=300");
    expect(response.headers["etag"]).toBeDefined();
  });
});
```

### 2. Testy integracyjne

```typescript
describe("GET /api/v1/source-texts/:id integration", () => {
  test("should return source text with associated flashcards", async () => {
    // Utwórz source text w bazie
    const { data: sourceText } = await supabase
      .from("source_texts")
      .insert({
        text_content: "Integration test source text",
      })
      .select()
      .single();

    // Utwórz fiszki powiązane z source text
    const { data: flashcards } = await supabase
      .from("flashcards")
      .insert([
        {
          front: "Test question 1",
          back: "Test answer 1",
          source: "ai",
          source_text_id: sourceText.id,
          user_id: testUserId,
        },
        {
          front: "Test question 2",
          back: "Test answer 2",
          source: "ai-edited",
          source_text_id: sourceText.id,
          user_id: testUserId,
        },
      ])
      .select();

    // Pobierz source text przez API
    const response = await request(app)
      .get(`/api/v1/source-texts/${sourceText.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.id).toBe(sourceText.id);
    expect(response.body.data.textContent).toBe("Integration test source text");
    expect(response.body.data.flashcards).toHaveLength(2);
    expect(response.body.data.flashcardCount).toBe(2);

    // Sprawdź czy fiszki są posortowane po created_at desc
    const flashcardIds = response.body.data.flashcards.map((fc) => fc.id);
    expect(flashcardIds).toEqual([flashcards[1].id, flashcards[0].id]);
  });

  test("should not return flashcards from different users", async () => {
    // Utwórz source text
    const { data: sourceText } = await supabase
      .from("source_texts")
      .insert({
        text_content: "Shared source text",
      })
      .select()
      .single();

    // Utwórz fiszki dla różnych użytkowników
    await supabase.from("flashcards").insert([
      {
        front: "My flashcard",
        back: "My answer",
        source: "ai",
        source_text_id: sourceText.id,
        user_id: testUserId,
      },
      {
        front: "Other user flashcard",
        back: "Other answer",
        source: "ai",
        source_text_id: sourceText.id,
        user_id: "other-user-id",
      },
    ]);

    // Pobierz source text
    const response = await request(app)
      .get(`/api/v1/source-texts/${sourceText.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Powinien zwrócić tylko fiszki należące do zalogowanego użytkownika
    expect(response.body.data.flashcards).toHaveLength(1);
    expect(response.body.data.flashcards[0].front).toBe("My flashcard");
    expect(response.body.data.flashcardCount).toBe(1);
  });
});
```

## Optymalizacje

### 1. Database Queries

```typescript
// Single query z JOIN zamiast dwóch osobnych zapytań
const { data, error } = await supabase
  .from("source_texts")
  .select(
    `
    *,
    flashcards:flashcards!source_text_id(
      id, front, back, source, created_at, updated_at
    )
  `
  )
  .eq("id", sourceTextId)
  .eq("flashcards.user_id", authContext.userId)
  .single();
```

### 2. Caching Strategy

```typescript
// Redis cache dla często pobieranych source texts
const cacheKey = `source_text:${sourceTextId}:${userId}`;
let cachedData = await redis.get(cacheKey);

if (!cachedData) {
  // Fetch from database
  cachedData = await fetchSourceTextWithFlashcards(sourceTextId);
  await redis.setex(cacheKey, 300, JSON.stringify(cachedData)); // 5min cache
}
```

### 3. Pagination dla fiszek

```typescript
// Jeśli source text ma dużo fiszek, dodaj paginację
interface SourceTextWithFlashcardsDto {
  // ... existing fields
  flashcards: FlashcardDto[];
  flashcardCount: number;
  flashcardsPagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

## Monitorowanie i metryki

### Kluczowe metryki

1. **Performance metrics**:

   - Czas odpowiedzi endpointa
   - Cache hit rate
   - Database query performance

2. **Business metrics**:

   - Najczęściej pobierane source texts
   - Średnia liczba fiszek per source text
   - Usage patterns (czy source texts są używane wielokrotnie)

3. **Error metrics**:
   - Rate błędów 404 (nieistniejące source texts)
   - Database timeout errors

## Use Cases

### 1. Podgląd przed generowaniem kolejnych fiszek

```typescript
// User sprawdza co już ma przed wygenerowaniem więcej
const sourceText = await getSourceTextById(sourceTextId);
console.log(`Masz już ${sourceText.flashcardCount} fiszek z tego tekstu`);
```

### 2. Review i edycja fiszek z source text

```typescript
// UI pokazuje wszystkie fiszki z danego source text do edycji
const sourceText = await getSourceTextById(sourceTextId);
sourceText.flashcards.forEach((fc) => {
  // Render flashcard editor
});
```

### 3. Analytics i statystyki

```typescript
// Analiza jakości AI generation per source text
const sourceText = await getSourceTextById(sourceTextId);
const editedCards = sourceText.flashcards.filter(
  (fc) => fc.source === "ai-edited"
);
const editRate = editedCards.length / sourceText.flashcardCount;
```

## Rozszerzenia przyszłościowe

### 1. Statistyki uczenia się

```typescript
interface SourceTextWithFlashcardsDto {
  // ... existing fields
  learningStats: {
    averageEaseFactor: number;
    nextReviewDates: string[];
    masteredCount: number;
    inProgressCount: number;
  };
}
```

### 2. Content Analysis

```typescript
interface SourceTextWithFlashcardsDto {
  // ... existing fields
  contentAnalysis: {
    language: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    topics: string[];
    suggestedAdditionalCards: number;
  };
}
```

## Podsumowanie

Endpoint GET `/api/v1/source-texts/:id` zapewnia:

✅ **Comprehensive View**: Source text + all related flashcards  
✅ **Security**: User isolation + proper authentication  
✅ **Performance**: Efficient queries + caching + ETag support  
✅ **Usability**: Rich data structure for UI development  
✅ **Scalability**: Optimized for growth + monitoring
