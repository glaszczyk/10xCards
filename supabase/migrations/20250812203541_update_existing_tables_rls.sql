-- Migration: Update Existing Tables with RLS
-- Description: Enables Row Level Security on existing tables and adds RLS policies
-- Affected Tables: source_texts, flashcards

-- Dodaj user_id do source_texts (jeśli nie ma)
ALTER TABLE public.source_texts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Włącz RLS dla source_texts
ALTER TABLE public.source_texts ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla source_texts
CREATE POLICY "Users can view own source texts" ON public.source_texts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own source texts" ON public.source_texts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own source texts" ON public.source_texts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own source texts" ON public.source_texts
    FOR DELETE USING (auth.uid() = user_id);

-- Upewnij się, że flashcards też mają RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards" ON public.flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Dodaj komentarze do polityk RLS
COMMENT ON POLICY "Users can view own source texts" ON public.source_texts IS 'Users can only view source texts they created';
COMMENT ON POLICY "Users can insert own source texts" ON public.source_texts IS 'Users can only insert source texts for themselves';
COMMENT ON POLICY "Users can update own source texts" ON public.source_texts IS 'Users can only update source texts they created';
COMMENT ON POLICY "Users can delete own source texts" ON public.source_texts IS 'Users can only delete source texts they created';

COMMENT ON POLICY "Users can view own flashcards" ON public.flashcards IS 'Users can only view flashcards they created';
COMMENT ON POLICY "Users can insert own flashcards" ON public.flashcards IS 'Users can only insert flashcards for themselves';
COMMENT ON POLICY "Users can update own flashcards" ON public.flashcards IS 'Users can only update flashcards they created';
COMMENT ON POLICY "Users can delete own flashcards" ON public.flashcards IS 'Users can only delete flashcards they created';
