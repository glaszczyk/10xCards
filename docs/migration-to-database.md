# Przejście z Mockowania do Bazy Danych

## Przegląd

Ten dokument opisuje kroki potrzebne do przejścia z mockowania endpointów do połączenia z bazą danych Supabase w aplikacji 10xCards.

## Co zostało zrobione

### 1. Rozszerzenie architektury providerów

- **Interfejs DataProvider**: Dodano metody dla operacji na source-texts
- **MockProvider**: Zaimplementowano wszystkie metody source-texts
- **SupabaseProvider**: Zaimplementowano wszystkie metody source-texts z połączeniem do bazy danych

### 2. Aktualizacja endpointów API

- **GET /api/v1/source-texts**: Lista tekstów źródłowych z paginacją
- **POST /api/v1/source-texts**: Tworzenie nowego tekstu źródłowego
- **GET /api/v1/source-texts/[id]**: Pobieranie tekstu źródłowego z fiszkami
- **PUT /api/v1/source-texts/[id]**: Aktualizacja tekstu źródłowego
- **DELETE /api/v1/source-texts/[id]**: Usuwanie tekstu źródłowego

### 3. Schemat bazy danych

- Zaktualizowano migrację `20240726103500_create_initial_schema.sql`
- Dodano kolumnę `user_id` do tabeli `source_texts`
- Dodano odpowiednie indeksy i polityki RLS

## Kroki do wykonania

### 1. Konfiguracja środowiska

1. **Skopiuj plik .env**:

   ```bash
   cp env.example .env
   ```

2. **Skonfiguruj zmienne środowiskowe** w pliku `.env`:

   ```env
   # Dla development z mockami
   DATA_PROVIDER=mock

   # Dla development z Supabase
   DATA_PROVIDER=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here

   # Dla production (auto-detect)
   DATA_PROVIDER=
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 2. Konfiguracja Supabase

1. **Utwórz projekt w Supabase** (jeśli jeszcze nie masz)

2. **Pobierz klucze API** z dashboardu Supabase:

   - URL projektu
   - Anon key (publiczny)

3. **Uruchom migracje**:
   ```bash
   npx supabase db push
   ```

### 3. Testowanie

1. **Test z mockami**:

   ```bash
   DATA_PROVIDER=mock npm run dev
   ```

2. **Test z Supabase**:

   ```bash
   DATA_PROVIDER=supabase npm run dev
   ```

3. **Test endpointów**:
   ```bash
   ./test-api-endpoints.sh
   ```

## Struktura kodu

### Provider Factory

```typescript
// Automatycznie wybiera provider na podstawie konfiguracji
const provider = DataProviderFactory.getProvider();
```

### Endpointy API

Wszystkie endpointy używają teraz `DataProviderFactory` zamiast bezpośredniego mockowania:

```typescript
// Przed (mock)
import { getMockSourceTextById } from "../../../../../lib/data/mock-source-text-store";
const sourceText = getMockSourceTextById(id);

// Po (provider)
import { DataProviderFactory } from "../../../../../lib/data/provider-factory";
const provider = DataProviderFactory.getProvider();
const sourceText = await provider.getSourceTextById(id);
```

## Obsługa błędów

Wszystkie endpointy obsługują teraz:

- Błędy walidacji (400)
- Błędy połączenia z bazą danych (503)
- Błędy wewnętrzne (500)

## Uwagi dotyczące autoryzacji

Obecnie kod używa `DEFAULT_USER_ID` dla wszystkich operacji. W przyszłości należy:

1. Zaimplementować system autoryzacji
2. Zastąpić `DEFAULT_USER_ID` prawdziwym ID użytkownika
3. Dodać middleware do weryfikacji tokenów JWT

## Następne kroki

1. **Implementacja autoryzacji** - zastąpienie `DEFAULT_USER_ID`
2. **Dodanie endpointów event-logs** - rozszerzenie o logowanie zdarzeń
3. **Optymalizacja zapytań** - dodanie dodatkowych indeksów
4. **Testy jednostkowe** - pokrycie kodu testami
5. **Monitoring** - dodanie logowania i metryk

## Troubleshooting

### Błędy połączenia z bazą danych

1. Sprawdź czy `SUPABASE_URL` i `SUPABASE_ANON_KEY` są poprawnie ustawione
2. Sprawdź czy migracje zostały uruchomione
3. Sprawdź logi w dashboardzie Supabase

### Błędy RLS (Row Level Security)

1. Sprawdź czy użytkownik jest uwierzytelniony
2. Sprawdź czy polityki RLS są poprawnie skonfigurowane
3. Sprawdź czy `user_id` jest poprawnie ustawione

### Przełączanie między providerami

```bash
# Wymuszenie przeładowania providera
DataProviderFactory.resetProvider();
```
