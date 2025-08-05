# Event Logging Implementation

## Problem

W bazie danych były dane w tabelach `flashcards` i `source_texts`, ale tylko jeden wpis w `event_logs`. To oznaczało, że:

1. **Event_logs nie były automatycznie tworzone** przy tworzeniu fiszek i source_texts
2. **Brakowało logiki logowania zdarzeń** w kodzie
3. **Nie było śledzenia historii operacji** na danych

## Rozwiązanie

### 1. Dodano logikę logowania zdarzeń

Zaimplementowano funkcję pomocniczą `logEvent()` w klasie `SupabaseProvider`:

```typescript
private async logEvent(eventType: string, payload?: any): Promise<void> {
  try {
    await supabaseClient
      .from("event_logs")
      .insert({
        user_id: DEFAULT_USER_ID,
        event_type: eventType,
        payload: payload || null,
      });
  } catch (error) {
    console.error("Error logging event:", error);
    // Don't throw error for logging failures to avoid breaking main functionality
  }
}
```

### 2. Dodano logowanie do wszystkich operacji CRUD

#### Tworzenie fiszek:

- `createManualFlashcard()` → `manual_card_created`
- `createAIFlashcards()` → `ai_card_created` + `source_text_created`

#### Aktualizacja fiszek:

- `updateFlashcard()` → `card_edited`

#### Usuwanie fiszek:

- `deleteFlashcard()` → `card_deleted`

#### Operacje na source_texts:

- `createSourceText()` → `source_text_created`
- `updateSourceText()` → `source_text_updated`
- `deleteSourceText()` → `source_text_deleted`

### 3. Utworzono kompletny schemat bazy danych

Wszystkie typy zdarzeń są już zawarte w schemacie:

```sql
CHECK (event_type in (
    'ai_card_created', 'ai_edited_card_created', 'manual_card_created',
    'ai_card_rejected', 'ai_edited_card_rejected', 'manual_card_rejected',
    'ai_card_reviewed', 'card_edited', 'card_deleted',
    'source_text_created', 'source_text_updated', 'source_text_deleted'
))
```

### 4. Dodano dane testowe

Migracja zawiera:

- Test user (test@example.com)
- 1 source_text (o React)
- 2 fiszki (1 manualna, 1 AI)
- 3 event_logs (odpowiadające operacjom tworzenia)

## Struktura payload dla różnych typów zdarzeń

### `manual_card_created`

```json
{
  "flashcard_id": "uuid",
  "source_text_id": "uuid" // null jeśli nie ma source_text
}
```

### `ai_card_created`

```json
{
  "source_text_id": "uuid",
  "generated_count": 2,
  "flashcard_ids": ["uuid1", "uuid2"]
}
```

### `source_text_created`

```json
{
  "source_text_id": "uuid",
  "text_length": 120
}
```

### `card_edited`

```json
{
  "flashcard_id": "uuid",
  "changes": {
    "front": "nowa treść",
    "back": "nowa odpowiedź"
  }
}
```

### `card_deleted`

```json
{
  "flashcard_id": "uuid"
}
```

### `source_text_updated`

```json
{
  "source_text_id": "uuid",
  "changes": {
    "text_content": "nowa treść"
  }
}
```

### `source_text_deleted`

```json
{
  "source_text_id": "uuid"
}
```

## Jak uruchomić migracje

```bash
# Run the event logging test
./test-event-logging.sh

# Run database migration (includes complete schema and test data)
./run-migrations.sh
```

Lub ręcznie:

```bash
supabase db reset
```

## Korzyści

1. **Pełne śledzenie historii** - każde zdarzenie jest logowane
2. **Audyt** - możliwość sprawdzenia kto i kiedy co zrobił
3. **Debugowanie** - łatwiejsze znajdowanie problemów
4. **Analytics** - możliwość analizy użycia aplikacji
5. **Bezpieczeństwo** - logi nie mogą być modyfikowane przez użytkowników

## Uwagi techniczne

- Logowanie zdarzeń nie przerywa głównej funkcjonalności (try-catch)
- Payload jest opcjonalny i może być null
- Event_logs są chronione przez RLS (Row Level Security)
- Użytkownicy mogą tylko odczytywać swoje logi
- Logi nie mogą być modyfikowane ani usuwane przez użytkowników
- Wszystkie tabele (source_texts, flashcards, event_logs) są chronione przez RLS
- Każdy użytkownik ma dostęp tylko do swoich danych
