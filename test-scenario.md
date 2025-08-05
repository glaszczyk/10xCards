# Scenariusz Testowy: Logowanie Zdarzeń

## Przewidywany Przebieg Testu

### 1. Stan Początkowy
Po uruchomieniu `./reset-db.sh`:
- **1 test user**: `test@example.com`
- **1 source_text**: o React (ID: `11111111-1111-1111-1111-111111111111`)
- **2 flashcards**: 
  - 1 manualna (ID: `22222222-2222-2222-2222-222222222222`)
  - 1 AI (ID: `33333333-3333-3333-3333-333333333333`)
- **3 event_logs**:
  - `source_text_created` (ID: `44444444-4444-4444-4444-444444444444`)
  - `manual_card_created` (ID: `55555555-5555-5555-5555-555555555555`)
  - `ai_card_created` (ID: `66666666-6666-6666-6666-666666666666`)

### 2. Test 1: Utworzenie Nowej Fiszki Manualnej
**Wywołanie API:**
```bash
POST /api/v1/flashcards
{
  "mode": "manual",
  "front": "Co to jest TypeScript?",
  "back": "TypeScript to nadzbiór JavaScript z typowaniem statycznym."
}
```

**Oczekiwane Zdarzenia:**
1. **`manual_card_created`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `manual_card_created`
   - `payload`: `{"flashcard_id": "nowy-uuid", "source_text_id": null}`

**Stan po operacji:**
- **flashcards**: 3 rekordy (2 początkowe + 1 nowa)
- **event_logs**: 4 rekordy (3 początkowe + 1 nowy)

### 3. Test 2: Utworzenie Fiszek AI
**Wywołanie API:**
```bash
POST /api/v1/flashcards
{
  "mode": "ai",
  "textContent": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych."
}
```

**Oczekiwane Zdarzenia:**
1. **`source_text_created`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `source_text_created`
   - `payload`: `{"source_text_id": "nowy-uuid", "text_length": 120}`

2. **`ai_card_created`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `ai_card_created`
   - `payload`: `{"source_text_id": "nowy-uuid", "generated_count": 2, "flashcard_ids": ["uuid1", "uuid2"]}`

**Stan po operacji:**
- **source_texts**: 2 rekordy (1 początkowy + 1 nowy)
- **flashcards**: 5 rekordów (3 poprzednie + 2 nowe AI)
- **event_logs**: 6 rekordów (4 poprzednie + 2 nowe)

### 4. Test 3: Edycja Fiszki
**Wywołanie API:**
```bash
PATCH /api/v1/flashcards/22222222-2222-2222-2222-222222222222
{
  "front": "Co to jest React? (zaktualizowane)",
  "back": "React to biblioteka JavaScript do budowania interfejsów użytkownika. (zaktualizowane)"
}
```

**Oczekiwane Zdarzenia:**
1. **`card_edited`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `card_edited`
   - `payload`: `{"flashcard_id": "22222222-2222-2222-2222-222222222222", "changes": {"front": "nowa treść", "back": "nowa odpowiedź"}}`

**Stan po operacji:**
- **flashcards**: 5 rekordów (bez zmian w liczbie, ale zaktualizowana treść)
- **event_logs**: 7 rekordów (6 poprzednich + 1 nowy)

### 5. Test 4: Usunięcie Fiszki
**Wywołanie API:**
```bash
DELETE /api/v1/flashcards/33333333-3333-3333-3333-333333333333
```

**Oczekiwane Zdarzenia:**
1. **`card_deleted`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `card_deleted`
   - `payload`: `{"flashcard_id": "33333333-3333-3333-3333-333333333333"}`

**Stan po operacji:**
- **flashcards**: 4 rekordy (5 poprzednich - 1 usunięty)
- **event_logs**: 8 rekordów (7 poprzednich + 1 nowy)

### 6. Test 5: Edycja Source Text
**Wywołanie API:**
```bash
PATCH /api/v1/source-texts/11111111-1111-1111-1111-111111111111
{
  "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Meta (dawniej Facebook) i jest używana do tworzenia aplikacji jednostronicowych."
}
```

**Oczekiwane Zdarzenia:**
1. **`source_text_updated`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `source_text_updated`
   - `payload`: `{"source_text_id": "11111111-1111-1111-1111-111111111111", "changes": {"text_content": "nowa treść"}}`

**Stan po operacji:**
- **source_texts**: 2 rekordy (bez zmian w liczbie, ale zaktualizowana treść)
- **event_logs**: 9 rekordów (8 poprzednich + 1 nowy)

### 7. Test 6: Usunięcie Source Text
**Wywołanie API:**
```bash
DELETE /api/v1/source-texts/11111111-1111-1111-1111-111111111111
```

**Oczekiwane Zdarzenia:**
1. **`source_text_deleted`** - nowy wpis w event_logs
   - `user_id`: `00000000-0000-0000-0000-000000000001`
   - `event_type`: `source_text_deleted`
   - `payload`: `{"source_text_id": "11111111-1111-1111-1111-111111111111"}`

**Stan po operacji:**
- **source_texts**: 1 rekord (2 poprzednie - 1 usunięty)
- **flashcards**: 3 rekordy (4 poprzednie - 1 usunięty przez CASCADE)
- **event_logs**: 10 rekordów (9 poprzednich + 1 nowy)

## Podsumowanie Oczekiwanych Wyników

### Końcowy Stan Bazy Danych:
- **source_texts**: 1 rekord
- **flashcards**: 3 rekordy
- **event_logs**: 10 rekordów

### Typy Zdarzeń w event_logs:
1. `source_text_created` (2x - początkowe + nowe)
2. `manual_card_created` (2x - początkowe + nowe)
3. `ai_card_created` (2x - początkowe + nowe)
4. `card_edited` (1x)
5. `card_deleted` (1x)
6. `source_text_updated` (1x)
7. `source_text_deleted` (1x)

### Weryfikacja:
- Każda operacja CRUD ma odpowiadający wpis w event_logs
- Payload zawiera odpowiednie metadane (ID, zmiany, liczba wygenerowanych elementów)
- RLS zapewnia, że użytkownik widzi tylko swoje dane
- Event_logs są immutable (nie można ich modyfikować ani usuwać)

## Jak Uruchomić Test:

```bash
# 1. Reset bazy danych
./reset-db.sh

# 2. Uruchom serwer
npm run dev

# 3. Wykonaj testy API
./test-api-endpoints.sh

# 4. Sprawdź event_logs
curl -X GET "http://localhost:4321/api/v1/event-logs" \
  -H "Authorization: Bearer your-jwt-token"
``` 