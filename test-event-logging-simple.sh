#!/bin/bash

# Simple Event Logging Test Script
# Testuje czy logowanie zdarzeń jest poprawnie zaimplementowane w kodzie

echo "🧪 Testing Event Logging Implementation"
echo "======================================="
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

echo -e "${BLUE}1. Checking if event logging is implemented in code...${NC}"

# Sprawdź czy logEvent jest zdefiniowane
if grep -q "private async logEvent" src/lib/data/supabase-provider.ts; then
    print_result "success" "logEvent method is defined"
else
    print_result "error" "logEvent method is missing"
    exit 1
fi

echo ""

echo -e "${BLUE}2. Checking if all CRUD operations have event logging...${NC}"

# Sprawdź wszystkie operacje
OPERATIONS=(
    "manual_card_created"
    "ai_card_created" 
    "source_text_created"
    "card_edited"
    "card_deleted"
    "source_text_updated"
    "source_text_deleted"
)

ALL_GOOD=true
for operation in "${OPERATIONS[@]}"; do
    if grep -q "logEvent.*$operation" src/lib/data/supabase-provider.ts; then
        print_result "success" "$operation is logged"
    else
        print_result "error" "$operation is NOT logged"
        ALL_GOOD=false
    fi
done

echo ""

echo -e "${BLUE}3. Checking database schema for event types...${NC}"

# Sprawdź czy wszystkie typy zdarzeń są w schemacie
SCHEMA_FILE="supabase/migrations/20240726103500_create_complete_schema.sql"
if [ -f "$SCHEMA_FILE" ]; then
    print_result "success" "Schema file exists"
    
    # Sprawdź czy wszystkie typy zdarzeń są w schemacie
    for operation in "${OPERATIONS[@]}"; do
        if grep -q "'$operation'" "$SCHEMA_FILE"; then
            print_result "success" "$operation is in schema"
        else
            print_result "error" "$operation is NOT in schema"
            ALL_GOOD=false
        fi
    done
else
    print_result "error" "Schema file not found"
    ALL_GOOD=false
fi

echo ""

echo -e "${BLUE}4. Checking RLS policies...${NC}"

# Sprawdź czy RLS jest włączone
if grep -q "enable row level security" "$SCHEMA_FILE"; then
    print_result "success" "RLS is enabled"
else
    print_result "error" "RLS is NOT enabled"
    ALL_GOOD=false
fi

# Sprawdź czy polityki RLS są zdefiniowane
if grep -q "create policy" "$SCHEMA_FILE"; then
    print_result "success" "RLS policies are defined"
else
    print_result "error" "RLS policies are NOT defined"
    ALL_GOOD=false
fi

echo ""

echo -e "${BLUE}5. Checking test data...${NC}"

# Sprawdź czy dane testowe są w migracji
if grep -q "INSERT INTO.*source_texts" "$SCHEMA_FILE"; then
    print_result "success" "Test source_text data is included"
else
    print_result "error" "Test source_text data is missing"
    ALL_GOOD=false
fi

if grep -q "INSERT INTO.*flashcards" "$SCHEMA_FILE"; then
    print_result "success" "Test flashcard data is included"
else
    print_result "error" "Test flashcard data is missing"
    ALL_GOOD=false
fi

if grep -q "INSERT INTO.*event_logs" "$SCHEMA_FILE"; then
    print_result "success" "Test event_logs data is included"
else
    print_result "error" "Test event_logs data is missing"
    ALL_GOOD=false
fi

echo ""

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}🎉 All checks passed! Event logging should work correctly.${NC}"
    echo ""
    echo "📝 Summary:"
    echo "- ✅ logEvent method is implemented"
    echo "- ✅ All CRUD operations have event logging"
    echo "- ✅ All event types are in database schema"
    echo "- ✅ RLS is enabled with proper policies"
    echo "- ✅ Test data is included in migration"
    echo ""
    echo "🚀 To test with actual API calls:"
    echo "1. Start the server: npm run dev"
    echo "2. Reset database: ./reset-db.sh"
    echo "3. Run API tests: ./test-api-endpoints.sh"
    echo "4. Check event logs: ./test-event-logging.sh"
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi 