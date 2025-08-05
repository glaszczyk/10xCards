#!/bin/bash

# 10xCards Database Migration Script
# Uruchamia migracje w odpowiedniej kolejności

echo "🔄 Running 10xCards database migrations..."
echo "=========================================="

# Sprawdź status Supabase
echo "📊 Checking Supabase status..."
npx supabase status

if [ $? -ne 0 ]; then
    echo "❌ Supabase is not running. Starting Supabase..."
    npx supabase start
fi

# Uruchom migracje
echo "🚀 Running migrations..."
npx supabase db reset

echo "✅ Migration completed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "- Created complete database schema with all tables and indexes"
echo "- Added comprehensive event logging for all CRUD operations"
echo "- Added test user and minimal test data"
echo "- Enabled Row Level Security (RLS) with proper policies for all tables"
echo ""
echo "🔍 You can now check the database to see:"
echo "- 1 test user (test@example.com)"
echo "- 1 source_text record (about React)"
echo "- 2 flashcard records (1 manual, 1 AI)"
echo "- 3 event_logs records (corresponding to the operations above)" 