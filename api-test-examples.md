# 10xCards API - Przykłady testowania z curl

## Konfiguracja

```bash
# Base URL (dostosuj do swojego środowiska)
BASE_URL="http://localhost:4321/api/v1"
AUTH_TOKEN="your-jwt-token-here"  # Zastąp rzeczywistym tokenem JWT
```

## 1. Health Check

### GET /api/v1/health

```bash
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json"
```

**Oczekiwana odpowiedź:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "provider": {
      "type": "mock",
      "healthy": true
    },
    "environment": {
      "nodeEnv": "development",
      "dataProvider": "auto",
      "hasSupabaseConfig": false
    }
  }
}
```

## 2. Flashcards

### GET /api/v1/flashcards (lista)

```bash
curl -X GET "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### GET /api/v1/flashcards (z filtrami)

```bash
curl -X GET "$BASE_URL/flashcards?source=ai&page=1&per_page=5&sort=createdAt&order=desc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### POST /api/v1/flashcards (manual mode)

```bash
curl -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mode": "manual",
    "front": "Co to jest JavaScript?",
    "back": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych."
  }'
```

### POST /api/v1/flashcards (AI mode)

```bash
curl -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mode": "ai",
    "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i jest używana do tworzenia aplikacji jednostronicowych."
  }'
```

### GET /api/v1/flashcards/:id

```bash
curl -X GET "$BASE_URL/flashcards/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### PATCH /api/v1/flashcards/:id

```bash
curl -X PATCH "$BASE_URL/flashcards/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "front": "Co to jest JavaScript? (zaktualizowane)",
    "back": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych. (zaktualizowane)"
  }'
```

### DELETE /api/v1/flashcards/:id

```bash
curl -X DELETE "$BASE_URL/flashcards/123e4567-e89b-12d3-a456-426614174007" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## 3. Source Texts

### POST /api/v1/source-texts

```bash
curl -X POST "$BASE_URL/source-texts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "textContent": "TypeScript to nadzbiór JavaScript, który dodaje opcjonalne typowanie statyczne, klasy i moduły do JavaScript. Kompiluje się do czystego JavaScript."
  }'
```

### GET /api/v1/source-texts/:id

```bash
curl -X GET "$BASE_URL/source-texts/text-123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## 4. Event Logs

### GET /api/v1/event-logs

```bash
curl -X GET "$BASE_URL/event-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### GET /api/v1/event-logs (z filtrami)

```bash
curl -X GET "$BASE_URL/event-logs?event_type=manual_card_created&page=1&per_page=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## 5. Testy błędów

### Nieprawidłowy UUID

```bash
curl -X GET "$BASE_URL/flashcards/invalid-uuid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Nieistniejący zasób

```bash
curl -X GET "$BASE_URL/flashcards/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Nieprawidłowe dane POST

```bash
curl -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mode": "manual",
    "front": "",
    "back": ""
  }'
```

### Brak autoryzacji

```bash
curl -X GET "$BASE_URL/flashcards" \
  -H "Content-Type: application/json"
```

## 6. Przykłady odpowiedzi

### Sukces (200/201)

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "front": "Co to jest JavaScript?",
    "back": "JavaScript to język programowania...",
    "source": "manual",
    "sourceTextId": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Błąd walidacji (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": "front is required"
  }
}
```

### Nie znaleziono (404)

```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard with id 00000000-0000-0000-0000-000000000000 not found"
  }
}
```

### Błąd serwera (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch flashcards"
  }
}
```

## 7. Użyteczne flagi curl

```bash
# Wyświetl nagłówki odpowiedzi
curl -i -X GET "$BASE_URL/health"

# Wyświetl tylko kod statusu
curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/health"

# Wyświetl czas odpowiedzi
curl -w "Time: %{time_total}s\n" -X GET "$BASE_URL/health"

# Zapisz odpowiedź do pliku
curl -X GET "$BASE_URL/flashcards" -o response.json

# Użyj jq do formatowania JSON
curl -s -X GET "$BASE_URL/flashcards" | jq '.'
```

## 8. Skrypt do automatycznego testowania

Użyj pliku `test-api-endpoints.sh` do automatycznego testowania wszystkich endpointów:

```bash
# Nadaj uprawnienia do wykonywania
chmod +x test-api-endpoints.sh

# Uruchom testy
./test-api-endpoints.sh
```

## 9. Uwagi

1. **Token JWT**: Zastąp `your-jwt-token-here` rzeczywistym tokenem JWT
2. **Port**: Upewnij się, że serwer Astro działa na porcie 4321
3. **Mock data**: Podczas rozwoju endpointy mogą zwracać dane testowe
4. **jq**: Zainstaluj `jq` dla lepszego formatowania JSON:

   ```bash
   # macOS
   brew install jq

   # Ubuntu/Debian
   sudo apt-get install jq
   ```
