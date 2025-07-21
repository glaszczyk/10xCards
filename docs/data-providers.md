# Data Providers Architecture

## Overview

Aplikacja 10xCards używa architektury providerów danych, która pozwala na łatwe przełączanie między różnymi źródłami danych (Supabase, mocki) bez zmiany kodu aplikacji.

## Architektura

### Interfejs DataProvider

Wszystkie providery implementują interfejs `DataProvider`:

```typescript
interface DataProvider {
  getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse>;
  createManualFlashcard(data: FlashcardCreateData): Promise<FlashcardResponse>;
  createAIFlashcards(
    data: FlashcardCreateAIData
  ): Promise<FlashcardCreateResponse>;
  isHealthy(): Promise<boolean>;
}
```

### Dostępne Providery

1. **SupabaseProvider** - używa Supabase jako bazy danych
2. **MockProvider** - używa danych mockowych w pamięci

### Fabryka Providerów

`DataProviderFactory` zarządza wyborem odpowiedniego providera na podstawie konfiguracji:

- Sprawdza zmienną środowiskową `DATA_PROVIDER`
- Jeśli nie ustawiona, automatycznie wykrywa na podstawie konfiguracji Supabase
- Fallback do mocków jeśli Supabase nie jest skonfigurowany

## Konfiguracja

### Zmienne środowiskowe

```bash
# Wymagane dla Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Opcjonalne - wybór providera
DATA_PROVIDER=supabase|mock|auto
```

### Przykłady konfiguracji

#### Development z mockami

```bash
DATA_PROVIDER=mock
```

#### Development z Supabase

```bash
DATA_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

#### Production (auto-detect)

```bash
# DATA_PROVIDER= (puste - auto-detect)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## Użycie w kodzie

### W API endpoints

```typescript
import { DataProviderFactory } from "../../../../lib/data/provider-factory";

export const GET: APIRoute = async ({ request, url }) => {
  const provider = DataProviderFactory.getProvider();
  const response = await provider.getFlashcards(query);
  // ...
};
```

### Sprawdzanie stanu

```typescript
// Health check
const isHealthy = await DataProviderFactory.isHealthy();

// Aktualny typ providera
const providerType = DataProviderFactory.getCurrentProviderType();
```

## Endpointy

### Health Check

`GET /api/v1/health` - sprawdza stan aplikacji i providerów

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "provider": {
      "type": "supabase",
      "healthy": true
    },
    "environment": {
      "nodeEnv": "development",
      "dataProvider": "auto",
      "hasSupabaseConfig": true
    }
  }
}
```

## Rozszerzanie

### Dodawanie nowego providera

1. Stwórz nową klasę implementującą `DataProvider`
2. Dodaj typ do `DataProviderType`
3. Zaktualizuj `DataProviderFactory.createProvider()`

```typescript
export class NewProvider implements DataProvider {
  async getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse> {
    // implementacja
  }
  // ... inne metody
}
```

### Migracja danych

Aby przenieść dane między providerami:

1. Użyj `MockProvider` do eksportu danych
2. Stwórz skrypt migracji używający `SupabaseProvider`
3. Uruchom migrację

## Debugowanie

### Logi

Provider automatycznie loguje:

- Typ używanego providera
- Błędy połączenia z bazą danych
- Operacje na danych

### Health Check

Użyj endpointu `/api/v1/health` aby sprawdzić:

- Czy provider jest zdrowy
- Jaki typ providera jest używany
- Konfigurację środowiska

## Bezpieczeństwo

### Row Level Security (RLS)

Supabase używa RLS do zabezpieczenia danych:

- Użytkownicy mogą widzieć tylko swoje fiszki
- Wszystkie operacje wymagają autoryzacji
- Anonimowe żądania są blokowane

### Walidacja

Wszystkie dane wejściowe są walidowane przez Zod schemas przed przekazaniem do providera.

## Performance

### Caching

- Mock provider używa danych w pamięci
- Supabase provider może korzystać z cache'owania na poziomie bazy danych
- API responses mają odpowiednie nagłówki cache

### Pagination

Wszystkie zapytania o listę fiszek obsługują paginację:

- `page` - numer strony (domyślnie 1)
- `perPage` - elementów na stronę (domyślnie 20, max 100)
