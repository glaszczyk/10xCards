-- Migration: Drop RLS Policies
-- Description: Drops all Row Level Security policies from flashcards, source_texts, and event_logs tables
-- Affected Tables: flashcards, source_texts, event_logs

-- Drop policies from source_texts table
drop policy if exists "allow authenticated insert for source_texts" on public.source_texts;
drop policy if exists "allow authenticated select for source_texts" on public.source_texts;
drop policy if exists "disallow anon access for source_texts" on public.source_texts;

-- Drop policies from flashcards table
drop policy if exists "allow authenticated select for own flashcards" on public.flashcards;
drop policy if exists "allow authenticated insert for own flashcards" on public.flashcards;
drop policy if exists "allow authenticated update for own flashcards" on public.flashcards;
drop policy if exists "allow authenticated delete for own flashcards" on public.flashcards;
drop policy if exists "disallow anon access for flashcards" on public.flashcards;

-- Drop policies from event_logs table
drop policy if exists "allow authenticated select for own event logs" on public.event_logs;
drop policy if exists "allow authenticated insert for own event logs" on public.event_logs;
drop policy if exists "disallow authenticated update for event logs" on public.event_logs;
drop policy if exists "disallow authenticated delete for event logs" on public.event_logs;
drop policy if exists "disallow anon access for event logs" on public.event_logs; 