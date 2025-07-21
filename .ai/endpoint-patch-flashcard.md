# Plan Implementacji Endpointa PATCH `/api/v1/flashcards/:id`

## Przegląd

Endpoint umożliwia aktualizację wybranych pól istniejącej fiszki należącej do zalogowanego użytkownika.

## Specyfikacja API

### Podstawowe informacje

```json
{
  "endpoint": "/api/v1/flashcards/:id",
  "method": "PATCH",
  "requestSchema": {
    "params": {
      "id": "UUID string (required)"
    },
    "body": "UpdateFlashcardDto"
  },
  "responseSchema": "ApiResponse<FlashcardResponseDto>",
  "authentication": "Bearer JWT Token",
  "rateLimit": "100 requests/minute per user"
}
```

### Parametry ścieżki

- **id** (string, required): UUID fiszki do zaktualizowania

### Schemat żądania

```typescript
{
  "front": "string (max 250 chars, optional)",
  "back": "string (max 750 chars, optional)"
}
```

### Schemat odpowiedzi

```typescript
{
  "data": {
    "id": "string",
    "front": "string",
    "back": "string",
    "source": "manual | ai | ai-edited",
    "sourceTextId": "string | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)",
    "easeFactor": "number | null",
    "interval": "number | null",
    "nextReviewAt": "string | null"
  }
}
```

## DTO i walidacja

### UpdateFlashcardDto

```typescript
export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
}

export const isUpdateFlashcardDto = (
  dto: unknown
): dto is UpdateFlashcardDto => {
  if (typeof dto !== "object" || dto === null) return false;

  const { front, back } = dto as UpdateFlashcardDto;

  // Przynajmniej jedno pole musi być podane
  if (front === undefined && back === undefined) {
    return false;
  }

  // Walidacja front jeśli podane
  if (
    front !== undefined &&
    (typeof front !== "string" || front.length === 0 || front.length > 250)
  ) {
    return false;
  }

  // Walidacja back jeśli podane
  if (
    back !== undefined &&
    (typeof back !== "string" || back.length === 0 || back.length > 750)
  ) {
    return false;
  }

  return true;
};
```

## Kroki implementacji

### 1. **Walidacja i autoryzacja**

- Sprawdzenie obecności i ważności tokenu JWT
- Pobranie `userId` z tokenu za pomocą Supabase Auth
- Walidacja parametru `id` jako poprawny UUID
- Walidacja request body za pomocą `isUpdateFlashcardDto()`

### 2. **Sprawdzenie istnienia fiszki**

- Pobranie aktualnej fiszki z bazy danych
- Sprawdzenie czy fiszka istnieje i należy do użytkownika
- Przygotowanie danych do aktualizacji

### 3. **Aktualizacja fiszki**

- Update tylko podanych pól
- Automatyczne ustawienie `updated_at`
- Zmiana `source` na "ai-edited" jeśli original był "ai"

### 4. **Logowanie zdarzenia**

- Zapisanie event logu typu "card_edited"
- Payload z informacją o zmienionych polach

### 5. **Zwrócenie odpowiedzi**

- Status 200 z zaktualizowaną fiszką
- Invalidacja cache (jeśli używamy)

## Implementacja

```typescript
app.patch("/api/v1/flashcards/:id", async (req: Request, res: Response) => {
  try {
    // 1. Autoryzacja i walidacja
    const authContext = await authenticateUser(req);
    const flashcardId = validateUUID(req.params.id);
    const updateDto = validateUpdateFlashcardDto(req.body);

    // 2. Sprawdzenie istnienia fiszki
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", authContext.userId)
      .single();

    if (fetchError || !existingFlashcard) {
      throw new FlashcardNotFoundError(flashcardId);
    }

    // 3. Przygotowanie danych do aktualizacji
    const updateData: Partial<TablesUpdate<"flashcards">> = {};

    if (updateDto.front !== undefined) {
      updateData.front = updateDto.front;
    }

    if (updateDto.back !== undefined) {
      updateData.back = updateDto.back;
    }

    // Zmiana source na "ai-edited" jeśli oryginał był "ai"
    if (existingFlashcard.source === "ai") {
      updateData.source = "ai-edited";
    }

    updateData.updated_at = new Date().toISOString();

    // 4. Aktualizacja w bazie danych
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .eq("user_id", authContext.userId)
      .select()
      .single();

    if (updateError || !updatedFlashcard) {
      throw new DatabaseError("Failed to update flashcard");
    }

    // 5. Logowanie zdarzenia
    await logEvent({
      userId: authContext.userId,
      eventType: "card_edited",
      payload: {
        flashcardId,
        changedFields: Object.keys(updateDto),
        originalSource: existingFlashcard.source,
        newSource: updatedFlashcard.source,
      },
    });

    // 6. Mapowanie odpowiedzi
    const responseData = mapToFlashcardResponseDto(updatedFlashcard);

    const response: ApiResponse<FlashcardResponseDto> = {
      data: responseData,
    };

    res.status(200).json(response);
  } catch (error) {
    await handleApiError(error, res, {
      userId: req.user?.id,
      endpoint: "PATCH /api/v1/flashcards/:id",
      flashcardId: req.params.id,
      requestBody: req.body,
    });
  }
});
```

## Obsługa błędów

### Definicje błędów

```typescript
export class EmptyUpdateError extends Error {
  constructor() {
    super("At least one field must be provided for update");
    this.name = "EmptyUpdateError";
  }
}

export class FlashcardNotFoundError extends Error {
  constructor(flashcardId: string) {
    super(`Flashcard with id ${flashcardId} not found`);
    this.name = "FlashcardNotFoundError";
  }
}
```

### Mapowanie błędów na kody HTTP

```typescript
const errorMapping = [
  { type: "ValidationError", status: 400, code: "VALIDATION_FAILED" },
  { type: "EmptyUpdateError", status: 400, code: "EMPTY_UPDATE" },
  { type: "UnauthorizedError", status: 401, code: "UNAUTHORIZED" },
  { type: "FlashcardNotFoundError", status: 404, code: "FLASHCARD_NOT_FOUND" },
  { type: "InvalidUUIDError", status: 400, code: "INVALID_UUID" },
  { type: "DatabaseError", status: 500, code: "DATABASE_ERROR" },
  { type: "RateLimitError", status: 429, code: "RATE_LIMIT_EXCEEDED" },
];
```

## Przykłady użycia

### Przykład 1: Aktualizacja front i back

```bash
curl -X PATCH http://localhost:3000/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "front": "Zaktualizowane pytanie",
    "back": "Zaktualizowana odpowiedź"
  }'
```

**Odpowiedź:**

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "front": "Zaktualizowane pytanie",
    "back": "Zaktualizowana odpowiedź",
    "source": "manual",
    "sourceTextId": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "easeFactor": null,
    "interval": null,
    "nextReviewAt": null
  }
}
```

### Przykład 2: Aktualizacja tylko front

```bash
curl -X PATCH http://localhost:3000/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "front": "Nowe pytanie"
  }'
```

### Przykład 3: Aktualizacja fiszki AI (zmiana source)

```bash
curl -X PATCH http://localhost:3000/api/v1/flashcards/456e7890-e89b-12d3-a456-426614174001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "back": "Poprawiona odpowiedź AI"
  }'
```

**Odpowiedź:**

```json
{
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "front": "Oryginalne pytanie AI",
    "back": "Poprawiona odpowiedź AI",
    "source": "ai-edited",
    "sourceTextId": "789e0123-e89b-12d3-a456-426614174002",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:35:00Z",
    "easeFactor": null,
    "interval": null,
    "nextReviewAt": null
  }
}
```

### Przykład 4: Błąd walidacji

```bash
curl -X PATCH http://localhost:3000/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "front": ""
  }'
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Front field cannot be empty"
  }
}
```

## Testy

### 1. Testy jednostkowe

```typescript
describe("PATCH /api/v1/flashcards/:id", () => {
  test("should update flashcard front and back", async () => {
    const flashcardId = "123e4567-e89b-12d3-a456-426614174000";
    const updateData = {
      front: "Updated question",
      back: "Updated answer",
    };

    const mockExistingFlashcard = {
      id: flashcardId,
      front: "Original question",
      back: "Original answer",
      source: "manual",
      user_id: testUserId,
    };

    const mockUpdatedFlashcard = {
      ...mockExistingFlashcard,
      ...updateData,
      updated_at: "2024-01-15T14:30:00Z",
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockExistingFlashcard, error: null }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
            }),
          }),
        }),
      }),
    });

    const response = await request(app)
      .patch(`/api/v1/flashcards/${flashcardId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.data.front).toBe("Updated question");
    expect(response.body.data.back).toBe("Updated answer");
  });

  test("should change source from ai to ai-edited", async () => {
    const flashcardId = "123e4567-e89b-12d3-a456-426614174000";

    const mockExistingFlashcard = {
      id: flashcardId,
      source: "ai",
      user_id: testUserId,
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockExistingFlashcard, error: null }),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockExistingFlashcard, source: "ai-edited" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const response = await request(app)
      .patch(`/api/v1/flashcards/${flashcardId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ front: "Updated AI card" })
      .expect(200);

    expect(response.body.data.source).toBe("ai-edited");
  });

  test("should return 400 for empty update", async () => {
    await request(app)
      .patch("/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000")
      .set("Authorization", `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  test("should return 404 for non-existent flashcard", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    await request(app)
      .patch("/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ front: "New front" })
      .expect(404);
  });
});
```

### 2. Testy integracyjne

```typescript
describe("PATCH /api/v1/flashcards/:id integration", () => {
  test("should update flashcard and log event", async () => {
    // Utwórz fiszkę w bazie
    const { data: flashcard } = await supabase
      .from("flashcards")
      .insert({
        front: "Original question",
        back: "Original answer",
        source: "manual",
        user_id: testUserId,
      })
      .select()
      .single();

    // Zaktualizuj fiszkę przez API
    const updateData = {
      front: "Updated question",
      back: "Updated answer",
    };

    const response = await request(app)
      .patch(`/api/v1/flashcards/${flashcard.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.data.front).toBe("Updated question");
    expect(response.body.data.back).toBe("Updated answer");
    expect(new Date(response.body.data.updatedAt)).toBeAfter(
      new Date(flashcard.updated_at)
    );

    // Sprawdź event log
    const { data: eventLog } = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", testUserId)
      .eq("event_type", "card_edited")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    expect(eventLog.payload.flashcardId).toBe(flashcard.id);
    expect(eventLog.payload.changedFields).toEqual(["front", "back"]);
  });
});
```

## Monitorowanie i metryki

### Kluczowe metryki

1. **Performance metrics**:

   - Czas odpowiedzi endpointa
   - Throughput aktualizacji

2. **Business metrics**:

   - Częstotliwość edycji fiszek
   - Najczęściej edytowane pola
   - Rate konwersji AI → AI-edited

3. **Error metrics**:
   - Rate błędów walidacji
   - Rate błędów 404 (nieistniejące fiszki)

## Funkcje pomocnicze

### Walidacja UpdateFlashcardDto

```typescript
const validateUpdateFlashcardDto = (body: unknown): UpdateFlashcardDto => {
  if (!isUpdateFlashcardDto(body)) {
    throw new ValidationError("Invalid update data");
  }

  return body;
};
```

### Logowanie zdarzeń

```typescript
const logEvent = async (eventData: {
  userId: string;
  eventType: EventType;
  payload: Record<string, unknown>;
}) => {
  await supabase.from("event_logs").insert({
    user_id: eventData.userId,
    event_type: eventData.eventType,
    payload: eventData.payload,
    timestamp: new Date().toISOString(),
  });
};
```

## Optymalizacje

### 1. Database

- Optymistic locking dla concurrent updates
- Batch updates jeśli potrzebne
- Index na `(user_id, id, updated_at)`

### 2. Business Logic

- Walidacja czy aktualizacja ma sens (czy coś rzeczywiście się zmieniło)
- Ograniczenie częstotliwości edycji per user
- History tracking dla istotnych zmian

### 3. Security

- Rate limiting per endpoint
- Audit trail dla wszystkich zmian
- Validation że user może edytować tę fiszkę

## Podsumowanie

Endpoint PATCH `/api/v1/flashcards/:id` zapewnia:

✅ **Bezpieczeństwo**: RLS + JWT auth + walidacja właścicielstwa  
✅ **Elastyczność**: Partial updates + automatic source management  
✅ **Auditability**: Complete event logging + change tracking  
✅ **Reliability**: Proper validation + error handling
