#!/bin/bash

# 10xCards Event Logging Test Script
# Testuje czy logowanie zdarzeń działa poprawnie

BASE_URL="http://localhost:4321/api/v1"
AUTH_TOKEN="your-jwt-token-here"

echo "🧪 Testing 10xCards Event Logging"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

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

# Sprawdź czy serwer jest uruchomiony
echo -e "${BLUE}1. Checking if server is running...${NC}"
if curl -s -X GET "$BASE_URL/health" > /dev/null; then
    print_result "success" "Server is running"
else
    print_result "error" "Server is not running. Please start the server first."
    exit 1
fi
echo ""

# Sprawdź aktualne event_logs
echo -e "${BLUE}2. Checking current event logs...${NC}"
EVENT_LOGS=$(curl -s -X GET "$BASE_URL/event-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq -r '.data | length' 2>/dev/null || echo "0")

echo "Current event logs count: $EVENT_LOGS"
echo ""

# Test 1: Utwórz source text
echo -e "${BLUE}3. Testing source text creation...${NC}"
SOURCE_TEXT_RESPONSE=$(curl -s -X POST "$BASE_URL/source-texts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "textContent": "TypeScript to nadzbiór JavaScript, który dodaje opcjonalne typowanie statyczne."
  }')

SOURCE_TEXT_ID=$(echo "$SOURCE_TEXT_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ "$SOURCE_TEXT_ID" != "null" ] && [ "$SOURCE_TEXT_ID" != "" ]; then
    print_result "success" "Source text created with ID: $SOURCE_TEXT_ID"
else
    print_result "error" "Failed to create source text"
    echo "Response: $SOURCE_TEXT_RESPONSE"
fi
echo ""

# Test 2: Utwórz manualną fiszkę
echo -e "${BLUE}4. Testing manual flashcard creation...${NC}"
MANUAL_CARD_RESPONSE=$(curl -s -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mode": "manual",
    "front": "Co to jest TypeScript?",
    "back": "TypeScript to nadzbiór JavaScript z typowaniem statycznym."
  }')

MANUAL_CARD_ID=$(echo "$MANUAL_CARD_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ "$MANUAL_CARD_ID" != "null" ] && [ "$MANUAL_CARD_ID" != "" ]; then
    print_result "success" "Manual flashcard created with ID: $MANUAL_CARD_ID"
else
    print_result "error" "Failed to create manual flashcard"
    echo "Response: $MANUAL_CARD_RESPONSE"
fi
echo ""

# Test 3: Utwórz AI fiszki
echo -e "${BLUE}5. Testing AI flashcard creation...${NC}"
AI_CARD_RESPONSE=$(curl -s -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "mode": "ai",
    "textContent": "JavaScript to język programowania wysokiego poziomu, interpretowany, używany głównie do tworzenia interaktywnych stron internetowych."
  }')

AI_CARDS_COUNT=$(echo "$AI_CARD_RESPONSE" | jq -r '.data | length' 2>/dev/null)
if [ "$AI_CARDS_COUNT" != "null" ] && [ "$AI_CARDS_COUNT" -gt 0 ]; then
    print_result "success" "AI flashcards created: $AI_CARDS_COUNT cards"
else
    print_result "error" "Failed to create AI flashcards"
    echo "Response: $AI_CARD_RESPONSE"
fi
echo ""

# Test 4: Sprawdź event_logs po operacjach
echo -e "${BLUE}6. Checking event logs after operations...${NC}"
NEW_EVENT_LOGS=$(curl -s -X GET "$BASE_URL/event-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq -r '.data | length' 2>/dev/null || echo "0")

echo "Event logs count after operations: $NEW_EVENT_LOGS"
EXPECTED_INCREASE=$((NEW_EVENT_LOGS - EVENT_LOGS))
echo "Expected increase: at least 3 (source_text_created + manual_card_created + ai_card_created)"

if [ "$EXPECTED_INCREASE" -ge 3 ]; then
    print_result "success" "Event logging is working correctly! (+$EXPECTED_INCREASE events)"
else
    print_result "error" "Event logging might not be working correctly. Expected +3, got +$EXPECTED_INCREASE"
fi
echo ""

# Test 5: Sprawdź szczegóły event_logs
echo -e "${BLUE}7. Checking event log details...${NC}"
EVENT_LOG_DETAILS=$(curl -s -X GET "$BASE_URL/event-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq -r '.data[0:5] | .[] | "\(.event_type): \(.payload)"' 2>/dev/null)

if [ -n "$EVENT_LOG_DETAILS" ]; then
    echo "Recent event logs:"
    echo "$EVENT_LOG_DETAILS" | while IFS= read -r line; do
        echo "  - $line"
    done
    print_result "success" "Event log details retrieved successfully"
else
    print_result "error" "Failed to retrieve event log details"
fi
echo ""

echo -e "${GREEN}🎉 Event Logging Test Complete!${NC}"
echo ""
echo "📝 Summary:"
echo "- Source text creation: $(if [ "$SOURCE_TEXT_ID" != "null" ] && [ "$SOURCE_TEXT_ID" != "" ]; then echo "✅"; else echo "❌"; fi)"
echo "- Manual flashcard creation: $(if [ "$MANUAL_CARD_ID" != "null" ] && [ "$MANUAL_CARD_ID" != "" ]; then echo "✅"; else echo "❌"; fi)"
echo "- AI flashcard creation: $(if [ "$AI_CARDS_COUNT" != "null" ] && [ "$AI_CARDS_COUNT" -gt 0 ]; then echo "✅"; else echo "❌"; fi)"
echo "- Event logging: $(if [ "$EXPECTED_INCREASE" -ge 3 ]; then echo "✅"; else echo "❌"; fi)"
echo ""
echo "💡 Tips:"
echo "- Make sure the server is running on localhost:4321"
echo "- Replace 'your-jwt-token-here' with a real JWT token if needed"
echo "- Install 'jq' for better JSON formatting" 