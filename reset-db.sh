#!/bin/bash

# 10xCards Database Reset Script
# Prosty skrypt do resetowania bazy danych

echo "🔄 Resetting 10xCards database..."
echo "=================================="

# Sprawdź czy Supabase CLI jest dostępne
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed or not in PATH"
    echo "Please install Supabase CLI first:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

# Reset bazy danych
echo "🚀 Resetting database..."
supabase db reset

if [ $? -eq 0 ]; then
    echo "✅ Database reset completed successfully!"
    echo ""
    echo "📝 What was created:"
echo "- Complete database schema with all tables and indexes"
echo "- Row Level Security (RLS) policies for data protection"
echo "- Test user: test@example.com"
echo "- 1 source text (about React)"
echo "- 2 flashcards (1 manual, 1 AI)"
echo "- 3 event logs (corresponding to operations)"
    echo ""
    echo "🔍 You can now test the application!"
else
    echo "❌ Database reset failed!"
    exit 1
fi 