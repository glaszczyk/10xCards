-- Migration: Create Profiles Table with RLS
-- Description: Creates the profiles table for additional user data with Row Level Security
-- Affected Tables: profiles

-- Tabela profiles dla dodatkowych danych użytkownika
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Włącz Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - użytkownicy widzą tylko swój profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger automatycznie tworzy profil po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Dodaj komentarze do tabeli i kolumn
COMMENT ON TABLE public.profiles IS 'Stores additional user profile information';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users(id) - the user this profile belongs to';
COMMENT ON COLUMN public.profiles.email IS 'User email address (duplicated from auth.users for convenience)';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name (optional)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image (optional)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';

-- Utwórz indeksy dla lepszej wydajności
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);
