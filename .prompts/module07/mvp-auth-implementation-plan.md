# Plan Implementacji Autoryzacji Supabase Auth - MVP 10xCards

## 📋 Analiza Istniejącego Stanu

### ✅ Co jest już zaimplementowane:

1. **Supabase Client** - `src/db/supabase.client.ts` z konfiguracją
2. **Auth Context** - `src/lib/auth.tsx` z podstawowymi funkcjami `signIn` i `signUp`
3. **UI Komponenty** - `LoginForm.tsx`, `RegisterForm.tsx` z walidacją
4. **Strony Auth** - `/auth/login` i `/auth/register` w Astro
5. **Middleware** - `src/middleware/index.ts` z ochroną tras
6. **Typy TypeScript** - `src/db/database.types.ts` z podstawowymi tabelami
7. **Struktura bazy** - migracje SQL z tabelami `flashcards`, `source_texts`, `event_logs`

### 🔄 Co wymaga implementacji:

1. **Konfiguracja Supabase** - projekt, URL, klucze
2. **Tabela `profiles`** - dodatkowe dane użytkownika
3. **RLS Policies** - zabezpieczenie danych
4. **Magic Link Authentication** - logowanie bez hasła
5. **Reset Password** - odzyskiwanie hasła
6. **Email Verification** - weryfikacja email
7. **Integracja UI z Backend** - połączenie formularzy z Supabase
8. **Session Management** - zarządzanie sesjami

---

## 🚀 Plan Implementacji - Krok po Kroku

### **FAZA 1: Konfiguracja Supabase (1-2 godziny)**

#### 1.1 Utworzenie projektu Supabase

- [ ] Przejdź do [supabase.com](https://supabase.com) i utwórz nowy projekt
- [ ] Zanotuj **Project URL** i **anon public key**
- [ ] W zakładce **Authentication** → **Settings**:
  - [ ] Włącz **Email confirmations**
  - [ ] Ustaw **Site URL** na `http://localhost:4321` (dev)
  - [ ] Włącz **Enable email confirmations**

#### 1.2 Konfiguracja metod logowania

- [ ] W **Authentication** → **Providers**:
  - [ ] **Email** - włączony (domyślnie)
  - [ ] **Magic Link** - włączony
  - [ ] **Social providers** - wyłączone (na razie)

#### 1.3 Konfiguracja email templates

- [ ] W **Authentication** → **Email Templates**:
  - [ ] Dostosuj **Confirm signup** template
  - [ ] Dostosuj **Magic Link** template
  - [ ] Dostosuj **Reset Password** template

### **FAZA 2: Konfiguracja Bazy Danych (2-3 godziny)**

#### 2.1 Utworzenie tabeli `profiles`

```sql
-- Utwórz tabelę profiles w Supabase SQL Editor
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Włącz RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Utwórz RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Utwórz trigger dla automatycznego tworzenia profilu
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

#### 2.2 Aktualizacja RLS dla istniejących tabel

```sql
-- Włącz RLS dla source_texts (jeśli nie jest włączone)
ALTER TABLE public.source_texts ENABLE ROW LEVEL SECURITY;

-- Dodaj user_id do source_texts (jeśli nie ma)
ALTER TABLE public.source_texts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS policies dla source_texts
CREATE POLICY "Users can view own source texts" ON public.source_texts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own source texts" ON public.source_texts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own source texts" ON public.source_texts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own source texts" ON public.source_texts
    FOR DELETE USING (auth.uid() = user_id);
```

#### 2.3 Aktualizacja typów TypeScript

- [ ] Dodaj tabelę `profiles` do `database.types.ts`
- [ ] Dodaj `user_id` do `source_texts` w typach
- [ ] Zaktualizuj typy dla `auth.users`

### **FAZA 3: Konfiguracja Środowiska (30 minut)**

#### 3.1 Aktualizacja pliku `.env`

```bash
# Dodaj do .env (nie commitować!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
DATA_PROVIDER=supabase
```

#### 3.2 Aktualizacja `env.example`

```bash
# Zaktualizuj env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
DATA_PROVIDER=supabase
```

### **FAZA 4: Rozszerzenie Auth Helpers (2-3 godziny)**

#### 4.1 Aktualizacja `src/lib/auth.tsx`

```typescript
// Dodaj nowe funkcje:
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

export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserProfile() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

#### 4.2 Aktualizacja AuthContext

```typescript
// Dodaj do AuthContext:
interface AuthSession {
  user: User | null;
  profile: Profile | null; // Nowe pole
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>; // Nowa funkcja
}
```

### **FAZA 5: Implementacja Magic Link (1-2 godziny)**

#### 5.1 Strona callback dla magic link

- [ ] Utwórz `src/pages/auth/callback.astro`
- [ ] Obsłuż `access_token` i `refresh_token` z URL
- [ ] Przekieruj użytkownika do aplikacji

#### 5.2 Komponent Magic Link w LoginForm

- [ ] Dodaj przycisk "Sign in with Magic Link"
- [ ] Implementuj formularz z jednym polem email
- [ ] Obsłuż wysyłanie magic link

### **FAZA 6: Implementacja Reset Password (2-3 godziny)**

#### 6.1 Strona resetowania hasła

- [ ] Utwórz `src/pages/auth/reset-password.astro`
- [ ] Formularz z nowym hasłem i potwierdzeniem
- [ ] Walidacja siły hasła

#### 6.2 Strona "Zapomniałem hasła"

- [ ] Utwórz `src/pages/auth/forgot-password.astro`
- [ ] Formularz z polem email
- [ ] Komunikat o wysłaniu linku

#### 6.3 Integracja z LoginForm

- [ ] Dodaj link "Zapomniałeś hasła?"
- [ ] Przekierowanie do strony resetowania

### **FAZA 7: Integracja UI z Backend (3-4 godziny)**

#### 7.1 Aktualizacja LoginForm

```typescript
// Zastąp mock implementację:
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
      error: error instanceof Error ? error.message : "Login failed",
    }));
  }
};
```

#### 7.2 Aktualizacja RegisterForm

```typescript
// Zastąp mock implementację:
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
      error: error instanceof Error ? error.message : "Registration failed",
    }));
  }
};
```

#### 7.3 Aktualizacja UserMenu

```typescript
// Dodaj funkcję wylogowania:
const handleSignOut = async () => {
  try {
    await signOut();
    // Przekierowanie nastąpi automatycznie przez middleware
  } catch (error) {
    console.error("Sign out error:", error);
  }
};
```

### **FAZA 8: Testowanie i Debugowanie (2-3 godziny)**

#### 8.1 Testowanie flow'ów

- [ ] Rejestracja nowego użytkownika
- [ ] Weryfikacja email
- [ ] Logowanie z hasłem
- [ ] Logowanie magic link
- [ ] Reset hasła
- [ ] Wylogowanie

#### 8.2 Testowanie RLS

- [ ] Sprawdź czy użytkownik widzi tylko swoje dane
- [ ] Sprawdź czy nie może dostać się do danych innych użytkowników
- [ ] Testuj operacje CRUD na fiszkach

#### 8.3 Testowanie middleware

- [ ] Sprawdź przekierowania dla niezalogowanych
- [ ] Sprawdź dostęp do chronionych tras
- [ ] Testuj publiczne ścieżki

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
- ✅ Secure HTTP-only cookies (jeśli używane)
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

## 🧪 Testowanie

### **Unit Tests**

- [ ] Testy funkcji auth helpers
- [ ] Testy walidacji formularzy
- [ ] Testy error handling

### **Integration Tests**

- [ ] Testy flow'ów rejestracji/logowania
- [ ] Testy RLS policies
- [ ] Testy middleware

### **E2E Tests**

- [ ] Pełne scenariusze użytkownika
- [ ] Testy na różnych urządzeniach
- [ ] Testy różnych przeglądarek

---

## 📊 Diagramy Procesów

### **Diagram Logowania**

```mermaid
flowchart TD
    User[Użytkownik] -->|Wprowadza email/hasło| "Formularz logowania"
    "Formularz logowania" -->|Wywołuje signIn| "Auth Helper"
    "Auth Helper" -->|supabase.auth.signInWithPassword| Supabase[Supabase Auth]
    Supabase -->|Weryfikuje dane| Supabase
    Supabase -->|Zwraca session/user| "Auth Helper"
    "Auth Helper" -->|Aktualizuje AuthContext| "React State"
    "React State" -->|Przekierowanie| Router[Astro Router]
    Router -->|Middleware sprawdza auth| "Chroniona trasa"

    Supabase -->|Błąd autoryzacji| "Error Handler"
    "Error Handler" -->|Pokazuje komunikat| UI[User Interface]
```

### **Diagram Rejestracji**

```mermaid
flowchart TD
    User[Użytkownik] -->|Podaje email/hasło| "Formularz rejestracji"
    "Formularz rejestracji" -->|Wywołuje signUp| "Auth Helper"
    "Auth Helper" -->|supabase.auth.signUp| Supabase[Supabase Auth]
    Supabase -->|Tworzy konto| "Database"
    Supabase -->|Wysyła email weryfikacyjny| "Email Service"
    "Email Service" -->|Link weryfikacyjny| User
    User -->|Klik link weryfikacyjny| Supabase
    Supabase -->|Potwierdza konto| "Database"
    Supabase -->|Redirect do app| "Auth Callback"
    "Auth Callback" -->|Automatyczne logowanie| "Main App"
```

### **Diagram Resetowania Hasła**

```mermaid
flowchart TD
    User[Użytkownik] -->|Podaje email| "Formularz resetowania"
    "Formularz resetowania" -->|Wywołuje resetPassword| "Auth Helper"
    "Auth Helper" -->|supabase.auth.resetPasswordForEmail| Supabase[Supabase Auth]
    Supabase -->|Wysyła email resetowy| "Email Service"
    "Email Service" -->|Link resetowy| User
    User -->|Klik link resetowy| "Strona resetowania"
    "Strona resetowania" -->|Nowe hasło| "Auth Helper"
    "Auth Helper" -->|supabase.auth.updateUser| Supabase
    Supabase -->|Aktualizuje hasło| "Database"
    Supabase -->|Potwierdzenie| "Success Message"
```

### **Diagram Magic Link**

```mermaid
flowchart TD
    User[Użytkownik] -->|Podaje email| "Formularz magic link"
    "Formularz magic link" -->|Wywołuje signInWithOtp| "Auth Helper"
    "Auth Helper" -->|supabase.auth.signInWithOtp| Supabase[Supabase Auth]
    Supabase -->|Wysyła magic link| "Email Service"
    "Email Service" -->|Magic link| User
    User -->|Klik magic link| "Auth Callback"
    "Auth Callback" -->|Przetwarza token| Supabase
    Supabase -->|Tworzy sesję| "Database"
    Supabase -->|Redirect do app| "Main App"
```

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
- **Faza 7-8**: 4-5 godzin (integracja i testy)

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
