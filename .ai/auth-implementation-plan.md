# Plan Implementacji Autoryzacji Supabase Auth - 10xCards

## 📋 Analiza Istniejącego Stanu

### ✅ Co jest już zaimplementowane:

- Supabase Client (`src/db/supabase.client.ts`)
- Podstawowy Auth Context (`src/lib/auth.tsx`)
- Middleware z ochroną tras (`src/middleware/index.ts`)
- UI komponenty (LoginForm, RegisterForm)
- Typy bazy danych (`src/db/database.types.ts`)

### 🔄 Co wymaga implementacji:

- Konfiguracja projektu Supabase
- Tabela `profiles` z RLS
- Magic Link authentication
- Reset hasła
- Weryfikacja email
- Integracja UI z backend
- Rozszerzenie middleware

---

## 🚀 FAZA 1: Konfiguracja Supabase (1-2 godziny)

### Krok 1.1: Utworzenie projektu Supabase

1. Przejdź do [supabase.com](https://supabase.com)
2. Kliknij "New Project"
3. Wybierz organizację lub utwórz nową
4. Wprowadź nazwę projektu: `10xcards`
5. Ustaw hasło do bazy danych (zapisz je!)
6. Wybierz region (najbliższy użytkownikom)
7. Kliknij "Create new project"

### Krok 1.2: Konfiguracja Authentication

1. W dashboardzie przejdź do **Authentication** → **Settings**
2. W sekcji **Site URL** ustaw: `http://localhost:4321`
3. W **Redirect URLs** dodaj:
   - `http://localhost:4321/auth/callback`
   - `http://localhost:4321/auth/reset-password`
4. Włącz **Enable email confirmations**
5. Włącz **Enable magic link authentication**

### Krok 1.3: Konfiguracja Email Templates

1. Przejdź do **Authentication** → **Email Templates**
2. Dostosuj **Confirm signup** template:
   - Tytuł: "Potwierdź swój email - 10xCards"
   - Treść: Dodaj logo i link do aplikacji
3. Dostosuj **Magic Link** template:
   - Tytuł: "Zaloguj się do 10xCards"
   - Treść: Krótkie wyjaśnienie magic link
4. Dostosuj **Reset Password** template:
   - Tytuł: "Reset hasła - 10xCards"
   - Treść: Instrukcje resetowania

### Krok 1.4: Pobranie kluczy API

1. W **Settings** → **API** znajdź:
   - **Project URL** (np. `https://abc123.supabase.co`)
   - **anon public key** (klucz zaczynający się od `eyJ...`)
2. Skopiuj te wartości - będą potrzebne w następnym kroku

---

## 🗄️ FAZA 2: Konfiguracja Bazy Danych (2-3 godziny)

### Krok 2.1: Utworzenie tabeli `profiles`

1. W dashboardzie przejdź do **SQL Editor**
2. Utwórz nowy query i wykonaj:

```sql
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
```

### Krok 2.2: Aktualizacja istniejących tabel

1. W tym samym query dodaj:

```sql
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
```

### Krok 2.3: Aktualizacja typów TypeScript

1. W terminalu wykonaj: `npm run update-types`
2. Sprawdź czy w `src/db/database.types.ts` pojawiła się tabela `profiles`
3. Jeśli nie, dodaj ręcznie:

```typescript
// Dodaj do Database.public.Tables
profiles: {
  Row: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    email?: string
    full_name?: string | null
    avatar_url?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "profiles_id_fkey"
      columns: ["id"]
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}
```

---

## ⚙️ FAZA 3: Konfiguracja Środowiska (30 minut)

### Krok 3.1: Utworzenie pliku `.env`

1. W głównym katalogu projektu utwórz plik `.env`
2. Dodaj konfigurację:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Data Provider
DATA_PROVIDER=supabase

# Development settings
NODE_ENV=development
```

3. Zastąp `your-project.supabase.co` i `your_anon_key_here` wartościami z kroku 1.4

### Krok 3.2: Aktualizacja `env.example`

1. Otwórz `env.example`
2. Zaktualizuj komentarze:

```bash
# Supabase Configuration
# Get these values from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Data Provider Configuration
# Options: 'supabase', 'mock', or leave empty for auto-detection
DATA_PROVIDER=supabase
```

### Krok 3.3: Sprawdzenie konfiguracji

1. Uruchom aplikację: `npm run dev`
2. Sprawdź w konsoli przeglądarki czy nie ma błędów Supabase
3. Sprawdź w Network tab czy są połączenia z Supabase

---

## 🔧 FAZA 4: Rozszerzenie Auth Helpers (2-3 godziny)

### Krok 4.1: Aktualizacja typów AuthSession

1. Otwórz `src/types/index.ts`
2. Zaktualizuj interfejs `AuthSession`:

```typescript
export interface AuthSession {
  user: User | null;
  profile: Profile | null; // Nowe pole
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>; // Nowa funkcja
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
```

### Krok 4.2: Rozszerzenie funkcji auth w `src/lib/auth.tsx`

1. Dodaj nowe funkcje na końcu pliku:

```typescript
// Magic Link authentication
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

// Reset password
export async function resetPassword(email: string) {
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    }
  );

  if (error) throw new Error(error.message);
  return data;
}

// Update password
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  return data;
}

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

### Krok 4.3: Aktualizacja AuthContext

1. Zaktualizuj `AuthProvider` w `src/lib/auth.tsx`:

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Funkcja do odświeżania profilu
  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await getUserProfile(user.id);
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await refreshProfile();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthSession = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

## 🔗 FAZA 5: Implementacja Magic Link (1-2 godziny)

### Krok 5.1: Utworzenie strony callback

1. Utwórz plik `src/pages/auth/callback.astro`:

```astro
---
// Obsługa callback z magic link i reset password
import { supabaseClient } from "@/db/supabase.client";

const url = new URL(Astro.request.url);
const accessToken = url.searchParams.get("access_token");
const refreshToken = url.searchParams.get("refresh_token");
const type = url.searchParams.get("type");

let message = "";
let isSuccess = false;

if (accessToken && refreshToken) {
  try {
    // Ustaw sesję
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      message = "Błąd autoryzacji: " + error.message;
    } else {
      isSuccess = true;
      if (type === "recovery") {
        message = "Hasło zostało zresetowane. Możesz się teraz zalogować.";
      } else {
        message = "Zalogowano pomyślnie! Przekierowywanie...";
      }
    }
  } catch (error) {
    message = "Wystąpił nieoczekiwany błąd.";
  }
} else {
  message = "Nieprawidłowy link autoryzacji.";
}

// Przekierowanie po 3 sekundach
if (isSuccess) {
  setTimeout(() => {
    window.location.href = "/generate";
  }, 3000);
}
---

<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Autoryzacja - 10xCards</title>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          {isSuccess ? "Sukces!" : "Błąd"}
        </h2>
        <p class="mt-2 text-gray-600">{message}</p>
        {isSuccess && (
          <div class="mt-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p class="text-sm text-gray-500 mt-2">Przekierowywanie...</p>
          </div>
        )}
      </div>
    </div>
  </div>
</body>
</html>
```

### Krok 5.2: Dodanie Magic Link do LoginForm

1. Otwórz `src/components/auth/LoginForm.tsx`
2. Dodaj stan dla magic link:

```typescript
const [showMagicLink, setShowMagicLink] = useState(false);
const [magicLinkEmail, setMagicLinkEmail] = useState("");
const [magicLinkStatus, setMagicLinkStatus] = useState<
  "idle" | "loading" | "success" | "error"
>("idle");
```

3. Dodaj funkcję obsługi magic link:

```typescript
const handleMagicLink = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!magicLinkEmail) return;

  setMagicLinkStatus("loading");
  try {
    await signInWithMagicLink(magicLinkEmail);
    setMagicLinkStatus("success");
    setMagicLinkEmail("");
  } catch (error) {
    setMagicLinkStatus("error");
  }
};
```

4. Dodaj UI dla magic link w komponencie:

```tsx
{
  /* Magic Link Section */
}
<div className="mt-6">
  <button
    type="button"
    onClick={() => setShowMagicLink(!showMagicLink)}
    className="text-sm text-blue-600 hover:text-blue-500"
  >
    {showMagicLink ? "Ukryj" : "Zaloguj się magic linkiem"}
  </button>

  {showMagicLink && (
    <form onSubmit={handleMagicLink} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="magic-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="magic-email"
          type="email"
          value={magicLinkEmail}
          onChange={(e) => setMagicLinkEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="twój@email.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={magicLinkStatus === "loading"}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {magicLinkStatus === "loading" ? "Wysyłanie..." : "Wyślij magic link"}
      </button>

      {magicLinkStatus === "success" && (
        <p className="text-sm text-green-600 text-center">
          Magic link został wysłany! Sprawdź swój email.
        </p>
      )}

      {magicLinkStatus === "error" && (
        <p className="text-sm text-red-600 text-center">
          Wystąpił błąd. Spróbuj ponownie.
        </p>
      )}
    </form>
  )}
</div>;
```

---

## 🔐 FAZA 6: Implementacja Reset Password (2-3 godziny)

### Krok 6.1: Strona "Zapomniałem hasła"

1. Utwórz plik `src/pages/auth/forgot-password.astro`:

```astro
---
// Strona do wysłania linku resetowania hasła
---

<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zapomniałeś hasła - 10xCards</title>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Zapomniałeś hasła?
        </h2>
        <p class="mt-2 text-gray-600">
          Wprowadź swój email, a wyślemy Ci link do resetowania hasła.
        </p>
      </div>

      <div id="forgot-password-form" class="mt-8 space-y-6">
        <!-- React component will be mounted here -->
      </div>

      <div class="text-center">
        <a href="/auth/login" class="text-sm text-blue-600 hover:text-blue-500">
          Wróć do logowania
        </a>
      </div>
    </div>
  </div>

  <script>
    import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
    import { createRoot } from "react-dom/client";

    const container = document.getElementById("forgot-password-form");
    if (container) {
      const root = createRoot(container);
      root.render(ForgotPasswordForm());
    }
  </script>
</body>
</html>
```

### Krok 6.2: Komponent ForgotPasswordForm

1. Utwórz plik `src/components/auth/ForgotPasswordForm.tsx`:

```tsx
import React, { useState } from "react";
import { resetPassword } from "@/lib/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await resetPassword(email);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Wystąpił błąd");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Email wysłany!
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Sprawdź swoją skrzynkę email. Link do resetowania hasła został
          wysłany.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Adres email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="twój@email.com"
        />
      </div>

      {status === "error" && (
        <div className="text-sm text-red-600 text-center">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {status === "loading" ? "Wysyłanie..." : "Wyślij link resetowania"}
      </button>
    </form>
  );
}
```

### Krok 6.3: Strona resetowania hasła

1. Utwórz plik `src/pages/auth/reset-password.astro`:

```astro
---
// Strona do ustawienia nowego hasła
---

<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset hasła - 10xCards</title>
</head>
<body>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Ustaw nowe hasło
        </h2>
        <p class="mt-2 text-gray-600">
          Wprowadź nowe hasło dla swojego konta.
        </p>
      </div>

      <div id="reset-password-form" class="mt-8 space-y-6">
        <!-- React component will be mounted here -->
      </div>
    </div>
  </div>

  <script>
    import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
    import { createRoot } from "react-dom/client";

    const container = document.getElementById("reset-password-form");
    if (container) {
      const root = createRoot(container);
      root.render(ResetPasswordForm());
    }
  </script>
</body>
</html>
```

### Krok 6.4: Komponent ResetPasswordForm

1. Utwórz plik `src/components/auth/ResetPasswordForm.tsx`:

```tsx
import React, { useState } from "react";
import { updatePassword } from "@/lib/auth";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Hasło musi mieć co najmniej 8 znaków";
    if (!/[A-Z]/.test(password)) return "Hasło musi zawierać wielką literę";
    if (!/[a-z]/.test(password)) return "Hasło musi zawierać małą literę";
    if (!/[0-9]/.test(password)) return "Hasło musi zawierać cyfrę";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Hasła nie są identyczne");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await updatePassword(password);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Wystąpił błąd");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Hasło zaktualizowane!
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Twoje hasło zostało zmienione. Możesz się teraz zalogować.
        </p>
        <div className="mt-4">
          <a
            href="/auth/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Nowe hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nowe hasło"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700"
        >
          Potwierdź nowe hasło
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Potwierdź nowe hasło"
        />
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 text-center">{errorMessage}</div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {status === "loading" ? "Aktualizowanie..." : "Zmień hasło"}
      </button>
    </form>
  );
}
```

---

## 🔗 FAZA 7: Integracja UI z Backend (3-4 godziny)

### Krok 7.1: Aktualizacja LoginForm

1. Otwórz `src/components/auth/LoginForm.tsx`
2. Zastąp mock implementację w `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setState((prev) => ({ ...prev, status: "loading", error: null }));

  try {
    const { data } = await signIn(
      state.formData.email,
      state.formData.password
    );

    if (data.user) {
      setState((prev) => ({ ...prev, status: "success" }));
      if (onSuccess) onSuccess();
    }
  } catch (error) {
    setState((prev) => ({
      ...prev,
      status: "error",
      error:
        error instanceof Error ? error.message : "Logowanie nie powiodło się",
    }));
  }
};
```

3. Dodaj link do resetowania hasła:

```tsx
{
  /* Link do resetowania hasła */
}
<div className="text-sm text-center">
  <a href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
    Zapomniałeś hasła?
  </a>
</div>;
```

### Krok 7.2: Aktualizacja RegisterForm

1. Otwórz `src/components/auth/RegisterForm.tsx`
2. Zastąp mock implementację w `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setState((prev) => ({ ...prev, status: "loading", error: null }));

  try {
    const { data } = await signUp(
      state.formData.email,
      state.formData.password
    );

    if (data.user) {
      setState((prev) => ({ ...prev, status: "success" }));
      // Pokaż komunikat o weryfikacji email
      if (onSuccess) onSuccess();
    }
  } catch (error) {
    setState((prev) => ({
      ...prev,
      status: "error",
      error:
        error instanceof Error ? error.message : "Rejestracja nie powiodła się",
    }));
  }
};
```

3. Zaktualizuj komunikat sukcesu:

```tsx
{
  state.status === "success" && (
    <div className="text-sm text-green-600 text-center">
      Konto zostało utworzone! Sprawdź swój email, aby potwierdzić rejestrację.
    </div>
  );
}
```

### Krok 7.3: Aktualizacja UserMenu

1. Otwórz `src/components/shared/UserMenu.tsx`
2. Dodaj funkcję wylogowania:

```typescript
import { signOut } from "@/lib/auth";

// W komponencie dodaj:
const handleSignOut = async () => {
  try {
    await signOut();
    // Przekierowanie nastąpi automatycznie przez middleware
  } catch (error) {
    console.error("Błąd wylogowania:", error);
  }
};

// W menu dodaj przycisk:
<button
  onClick={handleSignOut}
  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  Wyloguj się
</button>
```

---

## 🛡️ FAZA 8: Aktualizacja Middleware (1-2 godziny)

### Krok 8.1: Aktualizacja ścieżek publicznych

1. Otwórz `src/middleware/index.ts`
2. Zaktualizuj `publicPaths`:

```typescript
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api",
  "/about",
];

// Dodaj funkcję sprawdzającą ścieżki auth
const isAuthPath = (pathname: string) => {
  return pathname.startsWith("/auth/");
};

const isPublicPath = (pathname: string) => {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};
```

### Krok 8.2: Logika przekierowań

1. Zaktualizuj logikę w `onRequest`:

```typescript
export const onRequest = defineMiddleware(
  async (
    {
      locals,
      request,
      redirect,
    }: { locals: App.Locals; request: Request; redirect: Function },
    next
  ) => {
    (locals as any).supabase = supabaseClient;
    (locals as any).user = null;
    (locals as any).session = null;

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session) {
      (locals as any).user = session.user;
      (locals as any).session = session;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Jeśli użytkownik jest zalogowany i próbuje wejść na stronę auth
    if (session && isAuthPath(pathname)) {
      return redirect("/generate");
    }

    // Jeśli użytkownik nie jest zalogowany i próbuje wejść na chronioną trasę
    if (!session && !isPublicPath(pathname)) {
      return redirect(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`);
    }

    return next();
  }
);
```

---

## 🧪 FAZA 9: Testowanie i Debugowanie (2-3 godziny)

### Krok 9.1: Testowanie flow'ów autoryzacji

1. **Rejestracja nowego użytkownika:**

   - Przejdź do `/auth/register`
   - Wprowadź email i hasło
   - Sprawdź czy otrzymałeś email weryfikacyjny
   - Kliknij link weryfikacyjny

2. **Logowanie z hasłem:**

   - Przejdź do `/auth/login`
   - Wprowadź dane zarejestrowanego użytkownika
   - Sprawdź czy nastąpiło przekierowanie do `/generate`

3. **Magic Link:**

   - W formularzu logowania kliknij "Zaloguj się magic linkiem"
   - Wprowadź email
   - Sprawdź czy otrzymałeś magic link
   - Kliknij link w emailu

4. **Reset hasła:**

   - Przejdź do `/auth/forgot-password`
   - Wprowadź email
   - Sprawdź czy otrzymałeś link resetowania
   - Kliknij link i ustaw nowe hasło

5. **Wylogowanie:**
   - Zaloguj się
   - Kliknij menu użytkownika
   - Wybierz "Wyloguj się"
   - Sprawdź czy nastąpiło przekierowanie do logowania

### Krok 9.2: Testowanie RLS

1. **Sprawdź czy użytkownik widzi tylko swoje dane:**

   - Zaloguj się jako użytkownik A
   - Utwórz kilka fiszek
   - Wyloguj się
   - Zaloguj się jako użytkownik B
   - Sprawdź czy nie widzi fiszek użytkownika A

2. **Testuj operacje CRUD:**
   - Utwórz nową fiszkę
   - Edytuj istniejącą fiszkę
   - Usuń fiszkę
   - Sprawdź czy wszystkie operacje działają poprawnie

### Krok 9.3: Testowanie middleware

1. **Sprawdź przekierowania dla niezalogowanych:**

   - Wyloguj się
   - Przejdź do `/generate`
   - Sprawdź czy nastąpiło przekierowanie do `/auth/login`

2. **Sprawdź dostęp do chronionych tras:**

   - Zaloguj się
   - Przejdź do `/generate`
   - Sprawdź czy masz dostęp

3. **Testuj publiczne ścieżki:**
   - Wyloguj się
   - Przejdź do `/`
   - Sprawdź czy strona się wyświetla

---

## 🔐 Bezpieczeństwo i Najlepsze Praktyki

### **RLS (Row Level Security)**

- ✅ Wszystkie tabele z danymi użytkowników mają włączone RLS
- ✅ Polityki bazują na `auth.uid()` - identyfikator zalogowanego użytkownika
- ✅ Użytkownicy mogą operować tylko na swoich danych

### **Walidacja Danych**

- ✅ Frontend waliduje dane przed wysłaniem
- ✅ Backend (Supabase) waliduje dane na poziomie bazy
- ✅ Typy TypeScript zapewniają type safety

### **Sesje i Tokeny**

- ✅ JWT tokeny z automatycznym odświeżaniem
- ✅ Bezpieczne HTTP-only cookies
- ✅ Automatyczne wylogowanie po wygaśnięciu tokenu

### **Email Security**

- ✅ Weryfikacja email przed dostępem do aplikacji
- ✅ Magic linki z ograniczonym czasem ważności
- ✅ Bezpieczne linki resetowania hasła

---

## 📱 UX Considerations

### **Loading States**

- ✅ Wszystkie operacje auth mają loading indicators
- ✅ Disabled buttons podczas ładowania
- ✅ Progress indicators dla długich operacji

### **Error Handling**

- ✅ Jasne komunikaty błędów
- ✅ Sugestie rozwiązań problemów
- ✅ Graceful fallbacks

### **Responsive Design**

- ✅ Wszystkie formularze działają na mobile
- ✅ Touch-friendly buttons
- ✅ Readable typography na małych ekranach

---

## 🎯 Podsumowanie i Następne Kroki

### **Co zostanie osiągnięte:**

1. ✅ Pełna autoryzacja email/hasło
2. ✅ Magic link authentication
3. ✅ Reset hasła z weryfikacją email
4. ✅ Weryfikacja email po rejestracji
5. ✅ Tabela `profiles` z dodatkowymi danymi
6. ✅ RLS policies dla bezpieczeństwa
7. ✅ Integracja UI z backend
8. ✅ Middleware z ochroną tras

### **Szacowany czas implementacji:**

- **Total**: 12-18 godzin
- **Faza 1-3**: 3-5 godzin (konfiguracja)
- **Faza 4-6**: 5-8 godzin (implementacja)
- **Faza 7-9**: 4-5 godzin (integracja i testy)

### **Następne kroki po implementacji:**

1. **Monitoring** - śledzenie błędów auth
2. **Analytics** - metryki logowań/rejestracji
3. **Social Login** - Google, GitHub (opcjonalnie)
4. **MFA** - dwuskładnikowa autoryzacja
5. **Advanced RLS** - role i uprawnienia

### **Gotowość do produkcji:**

Po ukończeniu tego planu aplikacja będzie miała:

- ✅ Produkcyjną autoryzację Supabase
- ✅ Bezpieczne RLS policies
- ✅ Kompletny UX dla użytkowników
- ✅ Gotowość do skalowania

---

## 📚 Przydatne Linki i Dokumentacja

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase TypeScript](https://supabase.com/docs/guides/api/typescript-support)
- [Astro Middleware](https://docs.astro.build/en/guides/middleware/)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)

---

**🎉 Po ukończeniu tego planu będziesz mieć w pełni funkcjonalną autoryzację Supabase w aplikacji 10xCards!**
