# Plan Implementacji Endpointa POST `/api/v1/flashcards`

## Przegląd

Endpoint obsługuje tworzenie fiszek w trzech trybach:

- **Manual mode**: Użytkownik tworzy pojedynczą fiszkę ręcznie
- **AI mode**: AI analizuje tekst i generuje 1-N fiszek na podstawie kontekstu
- **AI auto mode**: AI generuje fiszki z tekstu (AI decyduje o liczbie)
- **AI count mode**: AI generuje określoną liczbę fiszek

## Specyfikacja API

### Podstawowe informacje

```json
{
  "endpoint": "/api/v1/flashcards",
  "method": "POST",
  "requestSchema": "CreateFlashcardDto (union type)",
  "responseSchema": "ApiResponse<FlashcardResponseDto[]>",
  "authentication": "Bearer JWT Token",
  "rateLimit": "100 requests/minute per user"
}
```

### Schemat żądania (Union Type)

#### Scenariusz 1: Ręczne tworzenie fiszki

```typescript
{
  "mode": "manual",
  "front": "string (max 250 chars, required)",
  "back": "string (max 750 chars, required)",
  "sourceTextId": "UUID string (optional)"
}
```

#### Scenariusz 2: AI generuje fiszki z tekstu (AI decyduje o liczbie)

```typescript
{
  "mode": "ai-auto",
  "textContent": "string (max 10000 chars, required)"
}
```

#### Scenariusz 3: AI generuje określoną liczbę fiszek

```typescript
{
  "mode": "ai-count",
  "textContent": "string (max 10000 chars, required)",
  "requestedCount": "number (1-10, required)"
}
```

### Schemat odpowiedzi (zawsze tablica)

```typescript
{
  "data": FlashcardResponseDto[], // 1-N fiszek w zależności od decyzji AI
  "meta": {
    "sourceTextId": "UUID | null", // tylko dla AI mode
    "generatedCount": "number",
    "mode": "manual | ai"
  }
}
```

## Implementacja DTO i typów

### 1. Aktualizacja CreateFlashcardDto

```typescript
// Union type dla obsługi trzech scenariuszy
export type CreateFlashcardDto =
  | CreateManualFlashcardDto
  | CreateAIFlashcardsAutoDto
  | CreateAIFlashcardsCountDto;

// Scenariusz 1: Ręczne tworzenie pojedynczej fiszki
export interface CreateManualFlashcardDto {
  mode: "manual";
  front: string;
  back: string;
  sourceTextId?: string; // opcjonalne powiązanie z istniejącym tekstem
}

// Scenariusz 2: AI generuje fiszki z tekstu (AI decyduje o liczbie)
export interface CreateAIFlashcardsAutoDto {
  mode: "ai-auto";
  textContent: string; // tekst do analizy przez AI
}

// Scenariusz 3: AI generuje określoną liczbę fiszek
export interface CreateAIFlashcardsCountDto {
  mode: "ai-count";
  textContent: string; // tekst do analizy przez AI
  requestedCount: number; // określona liczba fiszek (1-10)
}
```

### 2. Type Guard dla walidacji

```typescript
export const isCreateFlashcardDto = (
  dto: unknown
): dto is CreateFlashcardDto => {
  if (typeof dto !== "object" || dto === null) return false;

  const candidate = dto as CreateFlashcardDto;

  if (candidate.mode === "manual") {
    const { front, back } = candidate as CreateManualFlashcardDto;
    return (
      typeof front === "string" &&
      front.length <= 250 &&
      typeof back === "string" &&
      back.length <= 750
    );
  }

  if (candidate.mode === "ai-auto") {
    const { textContent } = candidate as CreateAIFlashcardsAutoDto;
    return (
      typeof textContent === "string" &&
      textContent.length > 0 &&
      textContent.length <= 10000
    );
  }

  if (candidate.mode === "ai-count") {
    const { textContent, requestedCount } =
      candidate as CreateAIFlashcardsCountDto;
    return (
      typeof textContent === "string" &&
      textContent.length > 0 &&
      textContent.length <= 10000 &&
      typeof requestedCount === "number" &&
      requestedCount >= 1 &&
      requestedCount <= 10
    );
  }

  return false;
};
```

### 3. Aktualizacja typu EventType

```typescript
export type EventType =
  | "ai_card_created"
  | "ai_cards_generated" // nowy typ zdarzenia dla batch generation
  | "ai_edited_card_created"
  | "manual_card_created"
  | "ai_card_reviewed"
  | "card_edited"
  | "card_deleted";
```

## Kroki implementacji

### 1. **Walidacja i autoryzacja**

- Sprawdzenie obecności i ważności tokenu JWT w nagłówku `Authorization: Bearer <token>`
- Pobranie `userId` z tokenu za pomocą Supabase Auth
- Walidacja request body za pomocą `isCreateFlashcardDto()`
- Rozpoznanie trybu (`manual` vs `ai`) na podstawie `dto.mode`

### 2. **Rozgałęzienie logiki według trybu**

#### A. **Tryb Manual (`mode: "manual"`)**

- Walidacja sourceTextId jeśli podany
- Utworzenie pojedynczej fiszki
- Mapowanie na tablicę z 1 elementem
- Logowanie zdarzenia

#### B. **Tryb AI (`mode: "ai"`)**

- Zapis tekstu
- **Wywołanie AI** z inteligentnym prompt
- AI decyduje czy tekst nadaje się na 1 fiszkę czy więcej (1-10 fiszek)
- Batch creation wielu fiszek
- Logowanie zdarzenia

### 3. **AI Decision Logic (dla trybu AI)**

#### AI Prompt Strategy

```typescript
const generateFlashcardsWithAI = async (
  textContent: string,
  mode: "auto" | "count",
  requestedCount?: number
): Promise<string> => {
  let aiPrompt: string;

  if (mode === "auto") {
    // AI decyduje o liczbie fiszek
    aiPrompt = `
Przeanalizuj poniższy tekst i zdecyduj ile fiszek można z niego utworzyć.

TEKST DO ANALIZY:
"${textContent}"

ZASADY GENEROWANIA:
1. Jeśli tekst zawiera jedną definicję/koncept = wygeneruj 1 fiszkę
2. Jeśli tekst zawiera listę/wiele konceptów = wygeneruj N fiszek (max 10)
3. Każda fiszka powinna być samodzielna i zrozumiała
4. Front: pytanie/termin (max 250 znaków)
5. Back: odpowiedź/definicja (max 750 znaków)

WYMAGANY FORMAT ODPOWIEDZI (JSON):
[
  {"front": "pytanie lub termin", "back": "odpowiedź lub definicja"},
  {"front": "pytanie2", "back": "odpowiedź2"}
]

PRZYKŁADY:
- Tekst: "JavaScript jest językiem programowania" → 1 fiszka
- Tekst: "Rodzaje psów: Labrador, Husky, Buldog" → 3 fiszki
`;
  } else {
    // Użytkownik określa liczbę fiszek
    aiPrompt = `
Wygeneruj dokładnie ${requestedCount} fiszek z poniższego tekstu.

TEKST DO ANALIZY:
"${textContent}"

ZASADY GENEROWANIA:
1. Wygeneruj dokładnie ${requestedCount} fiszek z tego tekstu
2. Jeśli tekst jest zbyt krótki, podziel go na części lub stwórz pytania z różnych perspektyw
3. Każda fiszka powinna być samodzielna i zrozumiała
4. Front: pytanie/termin (max 250 znaków)
5. Back: odpowiedź/definicja (max 750 znaków)
6. Unikaj powtórzeń - każda fiszka powinna być unikalna

WYMAGANY FORMAT ODPOWIEDZI (JSON):
[
  {"front": "pytanie 1", "back": "odpowiedź 1"},
  {"front": "pytanie 2", "back": "odpowiedź 2"},
  ... dokładnie ${requestedCount} fiszek
]
`;
  }

  // Wywołanie do AI service (OpenAI, Anthropic, etc.)
  return await aiService.generateResponse(aiPrompt);
};
```

#### Przetwarzanie odpowiedzi AI

```typescript
interface AIFlashcard {
  front: string;
  back: string;
}

const processAIResponse = (aiResponse: string): AIFlashcard[] => {
  try {
    const flashcards = JSON.parse(aiResponse) as AIFlashcard[];

    // Walidacja i oczyszczanie
    return flashcards
      .filter(
        (card) =>
          card.front &&
          card.back &&
          card.front.length <= 250 &&
          card.back.length <= 750
      )
      .slice(0, 10); // max 10 fiszek
  } catch (error) {
    throw new AIGenerationError("Invalid AI response format");
  }
};
```

### 4. **Zapis do bazy danych**

#### Manual Mode

```typescript
const createManualFlashcard = async (data: {
  front: string;
  back: string;
  userId: string;
  sourceTextId?: string;
}): Promise<FlashcardResponseDto> => {
  const flashcardData: TablesInsert<"flashcards"> = {
    user_id: data.userId,
    front: data.front,
    back: data.back,
    source: "manual",
    source_text_id: data.sourceTextId || null,
  };

  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .insert(flashcardData)
    .select()
    .single();

  if (error) throw new DatabaseError(error.message);

  return mapToFlashcardResponseDto(flashcard);
};
```

#### AI Mode

```typescript
const createAIFlashcards = async (data: {
  flashcards: AIFlashcard[];
  userId: string;
  sourceTextId: string;
}): Promise<FlashcardResponseDto[]> => {
  const flashcardsData: TablesInsert<"flashcards">[] = data.flashcards.map(
    (card) => ({
      user_id: data.userId,
      front: card.front,
      back: card.back,
      source: "ai",
      source_text_id: data.sourceTextId,
    })
  );

  const { data: flashcards, error } = await supabase
    .from("flashcards")
    .insert(flashcardsData)
    .select();

  if (error) throw new DatabaseError(error.message);

  return flashcards.map(mapToFlashcardResponseDto);
};
```

### 5. **Logowanie zdarzeń**

```typescript
// Manual mode
await logEvent({
  userId: authContext.userId,
  eventType: "manual_card_created",
  payload: { flashcardId: flashcard.id },
});

// AI mode
await logEvent({
  userId: authContext.userId,
  eventType: "ai_cards_generated",
  payload: {
    sourceTextId,
    generatedCount: flashcards.length,
    inputLength: dto.textContent.length,
    processingTime: endTime - startTime,
  },
});
```

### 6. **Mapowanie odpowiedzi**

```typescript
const mapToFlashcardResponseDto = (
  flashcard: FlashcardRow
): FlashcardResponseDto => ({
  id: flashcard.id,
  front: flashcard.front,
  back: flashcard.back,
  source: flashcard.source as FlashcardSource,
  sourceTextId: flashcard.source_text_id,
  createdAt: flashcard.created_at,
  updatedAt: flashcard.updated_at,
  easeFactor: flashcard.ease_factor,
  interval: flashcard.interval,
  nextReviewAt: flashcard.next_review_at,
});

// Zawsze zwracamy tablicę
const response: ApiResponse<FlashcardResponseDto[]> = {
  data: flashcardsArray, // 1 element (manual) lub N elementów (AI)
  meta: {
    sourceTextId: dto.mode === "ai" ? sourceTextId : null,
    generatedCount: flashcardsArray.length,
    mode: dto.mode,
  },
};
```

## Główna implementacja endpointa

```typescript
app.post("/api/v1/flashcards", async (req: Request, res: Response) => {
  try {
    // 1. Autoryzacja i walidacja
    const authContext = await authenticateUser(req);
    const dto = validateCreateFlashcardDto(req.body);

    // 2. Rozgałęzienie logiki według trybu
    let flashcards: FlashcardResponseDto[];
    let sourceTextId: string | null = null;
    const startTime = Date.now();

    if (dto.mode === "manual") {
      // === MANUAL MODE ===

      // Walidacja sourceTextId jeśli podany
      if (dto.sourceTextId) {
        await validateSourceTextExists(dto.sourceTextId);
      }

      // Utworzenie pojedynczej fiszki
      const flashcard = await createManualFlashcard({
        front: dto.front,
        back: dto.back,
        userId: authContext.userId,
        sourceTextId: dto.sourceTextId,
      });

      flashcards = [flashcard];

      // Logowanie zdarzenia
      await logEvent({
        userId: authContext.userId,
        eventType: "manual_card_created",
        payload: {
          flashcardId: flashcard.id,
          hasSourceText: !!dto.sourceTextId,
        },
      });
    } else if (dto.mode === "ai-auto") {
      // === AI AUTO MODE (AI decyduje o liczbie) ===

      // Zapisz source text
      sourceTextId = await createSourceText({
        textContent: dto.textContent,
      });

      // AI generuje fiszki (decyduje o liczbie)
      const aiResponse = await generateFlashcardsWithAI(
        dto.textContent,
        "auto"
      );
      const aiFlashcards = processAIResponse(aiResponse);

      if (aiFlashcards.length === 0) {
        throw new EmptyAIResponseError(
          "AI nie wygenerował żadnych fiszek z podanego tekstu"
        );
      }

      // Batch insert fiszek
      flashcards = await createAIFlashcards({
        flashcards: aiFlashcards,
        userId: authContext.userId,
        sourceTextId,
      });

      // Logowanie zdarzenia
      const endTime = Date.now();
      await logEvent({
        userId: authContext.userId,
        eventType: "ai_cards_generated",
        payload: {
          sourceTextId,
          generatedCount: flashcards.length,
          inputLength: dto.textContent.length,
          processingTime: endTime - startTime,
          mode: "auto",
        },
      });
    } else {
      // === AI COUNT MODE (określona liczba) ===

      // Zapisz source text
      sourceTextId = await createSourceText({
        textContent: dto.textContent,
      });

      // AI generuje konkretną liczbę fiszek
      const aiResponse = await generateFlashcardsWithAI(
        dto.textContent,
        "count",
        dto.requestedCount
      );
      const aiFlashcards = processAIResponse(aiResponse);

      // Walidacja czy AI wygenerował właściwą liczbę
      if (aiFlashcards.length === 0) {
        throw new EmptyAIResponseError(
          "AI nie wygenerował żadnych fiszek z podanego tekstu"
        );
      }

      if (aiFlashcards.length < dto.requestedCount) {
        console.warn(
          `AI wygenerował ${aiFlashcards.length} fiszek zamiast ${dto.requestedCount}`
        );
      }

      // Batch insert fiszek
      flashcards = await createAIFlashcards({
        flashcards: aiFlashcards,
        userId: authContext.userId,
        sourceTextId,
      });

      // Logowanie zdarzenia
      const endTime = Date.now();
      await logEvent({
        userId: authContext.userId,
        eventType: "ai_cards_generated",
        payload: {
          sourceTextId,
          generatedCount: flashcards.length,
          requestedCount: dto.requestedCount,
          inputLength: dto.textContent.length,
          processingTime: endTime - startTime,
          mode: "count",
        },
      });
    }

    // 3. Tworzenie odpowiedzi
    const response: ApiResponse<FlashcardResponseDto[]> = {
      data: flashcards,
      meta: {
        sourceTextId,
        generatedCount: flashcards.length,
        mode: dto.mode,
      },
    };

    // 4. Zwrócenie odpowiedzi
    res.status(201).json(response);
  } catch (error) {
    await handleApiError(error, res, {
      userId: req.user?.id,
      endpoint: "POST /api/v1/flashcards",
      requestBody: req.body,
    });
  }
});
```

## Obsługa błędów

### Definicje błędów

```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AIGenerationError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

export class EmptyAIResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmptyAIResponseError";
  }
}

export class SourceTextNotFoundError extends Error {
  constructor(sourceTextId: string) {
    super(`Source text with id ${sourceTextId} not found`);
    this.name = "SourceTextNotFoundError";
  }
}
```

### Mapowanie błędów na kody HTTP

```typescript
const errorMapping = [
  { type: "ValidationError", status: 400, code: "VALIDATION_FAILED" },
  { type: "UnauthorizedError", status: 401, code: "UNAUTHORIZED" },
  {
    type: "SourceTextNotFoundError",
    status: 400,
    code: "SOURCE_TEXT_NOT_FOUND",
  },
  { type: "AIGenerationError", status: 500, code: "AI_GENERATION_FAILED" },
  {
    type: "EmptyAIResponseError",
    status: 422,
    code: "NO_FLASHCARDS_GENERATED",
  },
  { type: "TextTooLongError", status: 400, code: "TEXT_TOO_LONG" },
  { type: "DatabaseError", status: 500, code: "DATABASE_ERROR" },
  { type: "RateLimitError", status: 429, code: "RATE_LIMIT_EXCEEDED" },
];
```

### Handler błędów

```typescript
const handleApiError = async (
  error: Error,
  res: Response,
  context: { userId?: string; endpoint: string; requestBody: unknown }
) => {
  // Logowanie błędu
  await logError({
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Mapowanie błędu na odpowiedź HTTP
  const errorInfo = errorMapping.find((e) => e.type === error.constructor.name);
  const status = errorInfo?.status || 500;
  const code = errorInfo?.code || "INTERNAL_SERVER_ERROR";

  const errorResponse: ApiError = {
    error: {
      code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };

  res.status(status).json(errorResponse);
};
```

## Przykłady użycia

### Przykład 1: Ręczne tworzenie fiszki

```bash
curl -X POST http://localhost:3000/api/v1/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "mode": "manual",
    "front": "Co to jest JavaScript?",
    "back": "JavaScript to dynamiczny język programowania używany głównie w rozwoju aplikacji webowych"
  }'
```

**Odpowiedź:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "front": "Co to jest JavaScript?",
      "back": "JavaScript to dynamiczny język programowania używany głównie w rozwoju aplikacji webowych",
      "source": "manual",
      "sourceTextId": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    }
  ],
  "meta": {
    "sourceTextId": null,
    "generatedCount": 1,
    "mode": "manual"
  }
}
```

### Przykład 2: AI generuje fiszki (1 fiszka)

```bash
curl -X POST http://localhost:3000/api/v1/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "mode": "ai",
    "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i pozwala na tworzenie komponentów wielokrotnego użytku."
  }'
```

**Odpowiedź:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "front": "Co to jest React?",
      "back": "React to biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Facebook, pozwalająca na tworzenie komponentów wielokrotnego użytku",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174002",
      "createdAt": "2024-01-15T10:35:00Z",
      "updatedAt": "2024-01-15T10:35:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    }
  ],
  "meta": {
    "sourceTextId": "456e7890-e89b-12d3-a456-426614174002",
    "generatedCount": 1,
    "mode": "ai"
  }
}
```

### Przykład 3: AI generuje wiele fiszek

```bash
curl -X POST http://localhost:3000/api/v1/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "mode": "ai-auto",
    "textContent": "Podstawowe typy danych w JavaScript: 1. String - reprezentuje tekst, 2. Number - reprezentuje liczby, 3. Boolean - reprezentuje wartości true/false, 4. Object - reprezentuje złożone struktury danych, 5. Array - reprezentuje listy wartości"
  }'
```

**Odpowiedź:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "front": "Jaki typ danych JavaScript reprezentuje tekst?",
      "back": "String",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
      "createdAt": "2024-01-15T10:40:00Z",
      "updatedAt": "2024-01-15T10:40:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "front": "Jaki typ danych JavaScript reprezentuje liczby?",
      "back": "Number",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
      "createdAt": "2024-01-15T10:40:00Z",
      "updatedAt": "2024-01-15T10:40:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "front": "Jaki typ danych JavaScript reprezentuje wartości true/false?",
      "back": "Boolean",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
      "createdAt": "2024-01-15T10:40:00Z",
      "updatedAt": "2024-01-15T10:40:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174007",
      "front": "Jaki typ danych JavaScript reprezentuje złożone struktury danych?",
      "back": "Object",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
      "createdAt": "2024-01-15T10:40:00Z",
      "updatedAt": "2024-01-15T10:40:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174008",
      "front": "Jaki typ danych JavaScript reprezentuje listy wartości?",
      "back": "Array",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
      "createdAt": "2024-01-15T10:40:00Z",
      "updatedAt": "2024-01-15T10:40:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    }
  ],
  "meta": {
    "sourceTextId": "456e7890-e89b-12d3-a456-426614174004",
    "generatedCount": 5,
    "mode": "ai-auto"
  }
}
```

### Przykład 4: AI generuje określoną liczbę fiszek

```bash
curl -X POST http://localhost:3000/api/v1/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "mode": "ai-count",
    "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i pozwala na tworzenie komponentów wielokrotnego użytku.",
    "requestedCount": 3
  }'
```

**Odpowiedź:**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "front": "Co to jest React?",
      "back": "React to biblioteka JavaScript do budowania interfejsów użytkownika",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174005",
      "createdAt": "2024-01-15T10:45:00Z",
      "updatedAt": "2024-01-15T10:45:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174010",
      "front": "Kto stworzył React?",
      "back": "Facebook",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174005",
      "createdAt": "2024-01-15T10:45:00Z",
      "updatedAt": "2024-01-15T10:45:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174011",
      "front": "Jaka jest główna zaleta React?",
      "back": "Pozwala na tworzenie komponentów wielokrotnego użytku",
      "source": "ai",
      "sourceTextId": "456e7890-e89b-12d3-a456-426614174005",
      "createdAt": "2024-01-15T10:45:00Z",
      "updatedAt": "2024-01-15T10:45:00Z",
      "easeFactor": null,
      "interval": null,
      "nextReviewAt": null
    }
  ],
  "meta": {
    "sourceTextId": "456e7890-e89b-12d3-a456-426614174005",
    "generatedCount": 3,
    "mode": "ai-count"
  }
}
```

## Testy

### 1. Testy jednostkowe

#### Test walidacji DTO

```typescript
describe("CreateFlashcardDto validation", () => {
  test("should validate manual mode DTO", () => {
    const validDto = {
      mode: "manual",
      front: "Test question",
      back: "Test answer",
    };

    expect(isCreateFlashcardDto(validDto)).toBe(true);
  });

  test("should validate AI mode DTO", () => {
    const validDto = {
      mode: "ai",
      textContent: "Some text content to analyze",
    };

    expect(isCreateFlashcardDto(validDto)).toBe(true);
  });

  test("should reject invalid mode", () => {
    const invalidDto = {
      mode: "invalid",
      front: "Test",
    };

    expect(isCreateFlashcardDto(invalidDto)).toBe(false);
  });
});
```

#### Test AI response processing

```typescript
describe("AI Response Processing", () => {
  test("should process valid AI response", () => {
    const aiResponse = `[
      {"front": "Question 1", "back": "Answer 1"},
      {"front": "Question 2", "back": "Answer 2"}
    ]`;

    const result = processAIResponse(aiResponse);

    expect(result).toHaveLength(2);
    expect(result[0].front).toBe("Question 1");
    expect(result[0].back).toBe("Answer 1");
  });

  test("should handle invalid JSON", () => {
    const invalidResponse = "not valid json";

    expect(() => processAIResponse(invalidResponse)).toThrow(AIGenerationError);
  });

  test("should filter cards exceeding length limits", () => {
    const aiResponse = `[
      {"front": "Valid question", "back": "Valid answer"},
      {"front": "${"x".repeat(251)}", "back": "Too long front"},
      {"front": "Valid", "back": "${"x".repeat(751)}"}
    ]`;

    const result = processAIResponse(aiResponse);

    expect(result).toHaveLength(1);
    expect(result[0].front).toBe("Valid question");
  });
});
```

### 2. Testy integracyjne

```typescript
describe("POST /api/v1/flashcards integration", () => {
  let authToken: string;

  beforeEach(async () => {
    authToken = await getTestAuthToken();
  });

  test("should create manual flashcard", async () => {
    const requestBody = {
      mode: "manual",
      front: "Test question",
      back: "Test answer",
    };

    const response = await request(app)
      .post("/api/v1/flashcards")
      .set("Authorization", `Bearer ${authToken}`)
      .send(requestBody)
      .expect(201);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].front).toBe("Test question");
    expect(response.body.data[0].source).toBe("manual");
    expect(response.body.meta.mode).toBe("manual");
    expect(response.body.meta.generatedCount).toBe(1);
  });

  test("should create AI flashcards", async () => {
    // Mock AI service
    mockAIService.mockResolvedValue(`[
      {"front": "What is React?", "back": "A JavaScript library"}
    ]`);

    const requestBody = {
      mode: "ai",
      textContent: "React is a JavaScript library for building user interfaces",
    };

    const response = await request(app)
      .post("/api/v1/flashcards")
      .set("Authorization", `Bearer ${authToken}`)
      .send(requestBody)
      .expect(201);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].source).toBe("ai");
    expect(response.body.data[0].sourceTextId).toBeTruthy();
    expect(response.body.meta.mode).toBe("ai");
  });

  test("should return 401 for unauthorized request", async () => {
    const requestBody = {
      mode: "manual",
      front: "Test",
      back: "Test",
    };

    await request(app).post("/api/v1/flashcards").send(requestBody).expect(401);
  });

  test("should return 400 for invalid DTO", async () => {
    const requestBody = {
      mode: "manual",
      front: "", // empty front
      back: "Test",
    };

    await request(app)
      .post("/api/v1/flashcards")
      .set("Authorization", `Bearer ${authToken}`)
      .send(requestBody)
      .expect(400);
  });
});
```

### 3. Testy E2E

```typescript
describe("Flashcard creation E2E", () => {
  test("complete manual flashcard creation flow", async () => {
    // 1. User authentication
    const { user, token } = await authenticateTestUser();

    // 2. Create flashcard
    const flashcardData = {
      mode: "manual",
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
    };

    const createResponse = await api
      .post("/api/v1/flashcards")
      .auth(token)
      .send(flashcardData);

    expect(createResponse.status).toBe(201);
    const flashcardId = createResponse.body.data[0].id;

    // 3. Verify flashcard exists in database
    const dbFlashcard = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .single();

    expect(dbFlashcard.data.user_id).toBe(user.id);
    expect(dbFlashcard.data.source).toBe("manual");

    // 4. Verify event log was created
    const eventLog = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_type", "manual_card_created")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    expect(eventLog.data.payload.flashcardId).toBe(flashcardId);
  });

  test("complete AI flashcard generation flow", async () => {
    // Mock AI service for consistent testing
    const mockAIResponse = `[
      {"front": "What is Node.js?", "back": "A JavaScript runtime"},
      {"front": "What is npm?", "back": "A package manager for Node.js"}
    ]`;

    mockAIService.mockResolvedValue(mockAIResponse);

    // 1. User authentication
    const { user, token } = await authenticateTestUser();

    // 2. Generate flashcards
    const generationData = {
      mode: "ai",
      textContent:
        "Node.js is a JavaScript runtime. npm is a package manager for Node.js.",
    };

    const response = await api
      .post("/api/v1/flashcards")
      .auth(token)
      .send(generationData);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.generatedCount).toBe(2);

    // 3. Verify source text was created
    const sourceTextId = response.body.meta.sourceTextId;
    const sourceText = await supabase
      .from("source_texts")
      .select("*")
      .eq("id", sourceTextId)
      .single();

    expect(sourceText.data.text_content).toBe(generationData.textContent);

    // 4. Verify all flashcards were created and linked
    const flashcards = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_text_id", sourceTextId);

    expect(flashcards.data).toHaveLength(2);
    expect(flashcards.data.every((f) => f.source === "ai")).toBe(true);

    // 5. Verify event log
    const eventLog = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_type", "ai_cards_generated")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    expect(eventLog.data.payload.generatedCount).toBe(2);
    expect(eventLog.data.payload.sourceTextId).toBe(sourceTextId);
  });
});
```

## Monitorowanie i metryki

### Kluczowe metryki do śledzenia

1. **Performance metrics**:

   - Czas odpowiedzi endpointa
   - Czas generowania AI (osobno)
   - Throughput (requests/second)

2. **Business metrics**:

   - Liczba fiszek generowanych przez AI vs manual
   - Średnia liczba fiszek z jednego tekstu AI
   - Rate success AI generation
   - Rozkład długości tekstów wejściowych

3. **Error metrics**:
   - Rate błędów AI generation
   - Rate błędów walidacji
   - Rate błędów autoryzacji

### Implementacja logowania metryk

```typescript
const trackMetrics = async (data: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  mode?: "manual" | "ai" | "ai-auto" | "ai-count";
  generatedCount?: number;
  aiProcessingTime?: number;
}) => {
  // Wysyłanie metryk do systemu monitorowania (np. DataDog, New Relic)
  await metricsClient.track("api.request", {
    ...data,
    timestamp: Date.now(),
  });
};
```

## Dodatkowe zagadnienia

### 1. Rate Limiting

- **Manual mode**: 100 requests/minute per user
- **AI mode**: 20 requests/minute per user (wolniejszy z powodu kosztów AI)
- **Burst protection**: max 10 requests w 10 sekund

### 2. Caching

- Cache AI responses dla identycznych tekstów (Redis, 24h TTL)
- Cache source text validation results (5 min TTL)
- ETag dla GET requests (future endpoint)

### 3. Security

- Input sanitization dla wszystkich string fields
- Rate limiting per IP i per user
- Request size limits (max 10KB body)
- CORS configuration dla frontendu

### 4. AI Service Integration

- Retry logic przy błędach AI (max 3 próby)
- Fallback na prostsze prompty przy błędach
- Circuit breaker pattern dla AI service
- Monitoring kosztów API calls

### 5. Database Optimizations

- Indexy na user_id, source_text_id, created_at
- Prepared statements dla batch inserts
- Connection pooling
- Transakcje dla atomicity przy AI generation

### 6. Deployment Considerations

- Environment-specific AI prompts
- Feature flags dla AI vs manual mode
- Health checks dla AI service connectivity
- Graceful degradation przy niedostępności AI

## Podsumowanie

Ten kompletny plan implementacji zapewnia:

✅ **Elastyczność**: Jeden endpoint obsługuje oba scenariusze  
✅ **Inteligencję**: AI decyduje o liczbie fiszek na podstawie kontekstu  
✅ **Skalowalnośc**: Obsługa batch operations i rate limiting  
✅ **Niezawodność**: Kompleksowa obsługa błędów i monitoring  
✅ **Testowalność**: Pełna pokrycie testami jednostkowymi, integracyjnymi i E2E  
✅ **Zgodność**: Zgodność z istniejącymi typami i schematem bazy danych
