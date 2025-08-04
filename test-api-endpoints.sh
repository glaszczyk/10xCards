#!/bin/bash

# 10xCards API Test Script
# Testuje wszystkie dostępne endpointy API lub pojedyncze endpointy

BASE_URL="http://localhost:4321/api/v1"
AUTH_TOKEN="your-jwt-token-here"  # Zastąp rzeczywistym tokenem JWT

# Funkcja wyświetlająca pomoc
show_help() {
    echo "🧪 10xCards API Test Script"
    echo "=========================="
    echo ""
    echo "Użycie:"
    echo "  $0                                    # Uruchom wszystkie testy"
    echo "  $0 [endpoint]                         # Uruchom konkretny endpoint"
    echo "  $0 flashcard-get [id]                 # GET /api/v1/flashcards/:id"
    echo "  $0 flashcard-patch [id]               # PATCH /api/v1/flashcards/:id"
    echo "  $0 flashcard-delete [id]              # DELETE /api/v1/flashcards/:id"
    echo "  $0 source-text-get [id]               # GET /api/v1/source-texts/:id"
    echo ""
    echo "Dostępne endpointy:"
    echo "  health               # GET /api/v1/health"
    echo "  health-post          # POST /api/v1/health"
    echo "  flashcards           # GET /api/v1/flashcards"
    echo "  flashcards-post      # POST /api/v1/flashcards (manual)"
    echo "  flashcards-ai        # POST /api/v1/flashcards (AI)"
    echo "  flashcard-get [id]   # GET /api/v1/flashcards/:id"
    echo "  flashcard-patch [id] # PATCH /api/v1/flashcards/:id"
    echo "  flashcard-delete [id]# DELETE /api/v1/flashcards/:id"
    echo "  source-texts-post    # POST /api/v1/source-texts"
    echo "  source-text-get [id] # GET /api/v1/source-texts/:id"
    echo "  event-logs           # GET /api/v1/event-logs"
    echo "  errors               # Testy błędów"
    echo ""
    echo "Przykłady:"
    echo "  $0 health                            # Test tylko health check"
    echo "  $0 flashcards                        # Test tylko GET flashcards"
    echo "  $0 flashcards-post                   # Test tylko POST flashcards"
    echo "  $0 flashcard-get 123e4567-e89b-12d3-a456-426614174000"
    echo "  $0 flashcard-patch mock-1754286447484-34ema0rna"
    echo ""
}

# Sprawdź argumenty
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Jeśli podano konkretny endpoint, uruchom tylko ten
if [ -n "$1" ]; then
    ENDPOINT="$1"
    echo "🧪 Testing 10xCards API Endpoint: $ENDPOINT"
    echo "============================================="
    echo "Base URL: $BASE_URL"
    echo ""
else
    echo "🧪 Testing 10xCards API Endpoints"
    echo "=================================="
    echo "Base URL: $BASE_URL"
    echo ""
fi

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do wyświetlania wyników
print_result() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Funkcje dla poszczególnych endpointów
test_health() {
    echo -e "${BLUE}1. Testing Health Check${NC}"
    echo "GET /api/v1/health"
    curl -s -X GET "$BASE_URL/health" \
      -H "Content-Type: application/json" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_health_post() {
    echo -e "${BLUE}1a. Testing Health Check POST${NC}"
    echo "POST /api/v1/health"
    curl -s -X POST "$BASE_URL/health" \
      -H "Content-Type: application/json" \
      -d '{"test": "data"}' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcards_get() {
    echo -e "${BLUE}2. Testing Flashcards - GET (list)${NC}"
    echo "GET /api/v1/flashcards"
    curl -s -X GET "$BASE_URL/flashcards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcards_get_filtered() {
    echo -e "${BLUE}2a. Testing Flashcards - GET (with filters)${NC}"
    echo "GET /api/v1/flashcards?source=ai&page=1&per_page=5&sort=createdAt&order=desc"
    curl -s -X GET "$BASE_URL/flashcards?source=ai&page=1&per_page=5&sort=createdAt&order=desc" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcards_post_manual() {
    echo -e "${BLUE}3. Testing Flashcards - POST (manual)${NC}"
    echo "POST /api/v1/flashcards"
    curl -s -X POST "$BASE_URL/flashcards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "mode": "manual",
        "front": "Co to jest JavaScript?",
        "back": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych."
      }' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcards_post_ai() {
    echo -e "${BLUE}4. Testing Flashcards - POST (AI mode)${NC}"
    echo "POST /api/v1/flashcards"
    curl -s -X POST "$BASE_URL/flashcards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "mode": "ai",
        "textContent": "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i jest używana do tworzenia aplikacji jednostronicowych."
      }' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcard_get() {
    local flashcard_id="${1:-123e4567-e89b-12d3-a456-426614174000}"
    echo -e "${BLUE}5. Testing Flashcards - GET (single flashcard)${NC}"
    echo "GET /api/v1/flashcards/$flashcard_id"
    curl -s -X GET "$BASE_URL/flashcards/$flashcard_id" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcard_patch() {
    local flashcard_id="${1:-123e4567-e89b-12d3-a456-426614174000}"
    echo -e "${BLUE}6. Testing Flashcards - PATCH (update)${NC}"
    echo "PATCH /api/v1/flashcards/$flashcard_id"
    curl -s -X PATCH "$BASE_URL/flashcards/$flashcard_id" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "front": "Co to jest JavaScript? (zaktualizowane)",
        "back": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych. (zaktualizowane)"
      }' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_flashcard_delete() {
    local flashcard_id="${1:-123e4567-e89b-12d3-a456-426614174007}"
    echo -e "${BLUE}7. Testing Flashcards - DELETE${NC}"
    echo "DELETE /api/v1/flashcards/$flashcard_id"
    curl -s -X DELETE "$BASE_URL/flashcards/$flashcard_id" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_source_texts_post() {
    echo -e "${BLUE}8. Testing Source Texts - POST${NC}"
    echo "POST /api/v1/source-texts"
    curl -s -X POST "$BASE_URL/source-texts" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "textContent": "TypeScript to nadzbiór JavaScript, który dodaje opcjonalne typowanie statyczne, klasy i moduły do JavaScript. Kompiluje się do czystego JavaScript."
      }' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_source_text_get() {
    local source_text_id="${1:-text-123}"
    echo -e "${BLUE}9. Testing Source Texts - GET (single source text)${NC}"
    echo "GET /api/v1/source-texts/$source_text_id"
    curl -s -X GET "$BASE_URL/source-texts/$source_text_id" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_event_logs_get() {
    echo -e "${BLUE}10. Testing Event Logs - GET${NC}"
    echo "GET /api/v1/event-logs"
    curl -s -X GET "$BASE_URL/event-logs" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_event_logs_get_filtered() {
    echo -e "${BLUE}10a. Testing Event Logs - GET (with filters)${NC}"
    echo "GET /api/v1/event-logs?event_type=manual_card_created&page=1&per_page=10"
    curl -s -X GET "$BASE_URL/event-logs?event_type=manual_card_created&page=1&per_page=10" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

test_errors() {
    echo -e "${BLUE}11. Testing Error Cases${NC}"

    # 11a. Nieprawidłowy UUID
    echo -e "${YELLOW}11a. Invalid UUID${NC}"
    echo "GET /api/v1/flashcards/invalid-uuid"
    curl -s -X GET "$BASE_URL/flashcards/invalid-uuid" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""

    # 11b. Nieistniejący zasób
    echo -e "${YELLOW}11b. Non-existent resource${NC}"
    echo "GET /api/v1/flashcards/00000000-0000-0000-0000-000000000000"
    curl -s -X GET "$BASE_URL/flashcards/00000000-0000-0000-0000-000000000000" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""

    # 11c. Nieprawidłowe dane POST
    echo -e "${YELLOW}11c. Invalid POST data${NC}"
    echo "POST /api/v1/flashcards"
    curl -s -X POST "$BASE_URL/flashcards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d '{
        "mode": "manual",
        "front": "",
        "back": ""
      }' \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""

    # 11d. Brak autoryzacji
    echo -e "${YELLOW}11d. Missing authorization${NC}"
    echo "GET /api/v1/flashcards"
    curl -s -X GET "$BASE_URL/flashcards" \
      -H "Content-Type: application/json" \
      -w "\nHTTP Status: %{http_code}\n" \
      | jq '.' 2>/dev/null || echo "Response (no jq):"
    echo ""
}

# Główna logika wyboru endpointów
if [ -n "$ENDPOINT" ]; then
    # Uruchom konkretny endpoint
    case "$ENDPOINT" in
        "health")
            test_health
            ;;
        "health-post")
            test_health_post
            ;;
        "flashcards")
            test_flashcards_get
            ;;
        "flashcards-filtered")
            test_flashcards_get_filtered
            ;;
        "flashcards-post")
            test_flashcards_post_manual
            ;;
        "flashcards-ai")
            test_flashcards_post_ai
            ;;
        "flashcard-get")
            test_flashcard_get "$2"
            ;;
        "flashcard-patch")
            test_flashcard_patch "$2"
            ;;
        "flashcard-delete")
            test_flashcard_delete "$2"
            ;;
        "source-texts-post")
            test_source_texts_post
            ;;
        "source-text-get")
            test_source_text_get "$2"
            ;;
        "event-logs")
            test_event_logs_get
            ;;
        "event-logs-filtered")
            test_event_logs_get_filtered
            ;;
        "errors")
            test_errors
            ;;
        *)
            echo -e "${RED}❌ Nieznany endpoint: $ENDPOINT${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
else
    # Uruchom wszystkie testy
    test_health
    test_health_post
    test_flashcards_get
    test_flashcards_get_filtered
    test_flashcards_post_manual
    test_flashcards_post_ai
    test_flashcard_get
    test_flashcard_patch
    test_flashcard_delete
    test_source_texts_post
    test_source_text_get
    test_event_logs_get
    test_event_logs_get_filtered
    test_errors
fi

if [ -z "$ENDPOINT" ]; then
    echo -e "${GREEN}🎉 API Testing Complete!${NC}"
    echo ""
    echo "📝 Notes:"
    echo "- Replace 'your-jwt-token-here' with a real JWT token for authenticated endpoints"
    echo "- Install 'jq' for better JSON formatting: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    echo "- Make sure the Astro dev server is running on localhost:4321"
    echo "- Some endpoints may return mock data during development"
    echo ""
    echo "💡 Tip: Use '$0 [endpoint]' to test specific endpoints"
    echo "   Example: $0 health"
    echo "   Example: $0 flashcards-post"
else
    echo -e "${GREEN}🎉 Endpoint test complete!${NC}"
    echo ""
    echo "💡 Tip: Use '$0' to run all tests"
    echo "   Use '$0 --help' to see all available endpoints"
fi 