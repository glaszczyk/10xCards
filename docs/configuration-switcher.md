# Configuration Switcher

## Opis

Skrypt `switch-config.sh` pozwala łatwo przełączać między różnymi konfiguracjami środowiska bez utraty ustawień lokalnych. Automatycznie tworzy backupy konfiguracji i obsługuje fallback jeśli plik `.env` nie istnieje.

## Funkcje

### 🔄 Przełączanie Konfiguracji
```bash
# Przełącz na mock data
./switch-config.sh mock

# Przełącz na Supabase
./switch-config.sh supabase

# Przełącz na auto-detection
./switch-config.sh auto
```

### 📋 Listowanie Konfiguracji
```bash
# Pokaż wszystkie dostępne konfiguracje
./switch-config.sh list
```

### ➕ Tworzenie Nowych Konfiguracji
```bash
# Utwórz nową konfigurację typu supabase
./switch-config.sh create dev supabase

# Utwórz nową konfigurację typu mock
./switch-config.sh create test mock

# Utwórz nową konfigurację typu auto
./switch-config.sh create prod auto
```

### 💾 Backup i Restore
```bash
# Utwórz backup aktualnej konfiguracji
./switch-config.sh backup

# Przywróć z backupu
./switch-config.sh restore backup_20250805_071700.env
```

### 🗑️ Usuwanie Konfiguracji
```bash
# Usuń konfigurację
./switch-config.sh delete dev
```

## Typy Konfiguracji

### Mock Data
```bash
DATA_PROVIDER=mock
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```
- Używa danych w pamięci
- Nie wymaga bazy danych
- Idealne do testowania i rozwoju

### Supabase
```bash
DATA_PROVIDER=supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```
- Używa Supabase jako bazy danych
- Wymaga skonfigurowanego projektu Supabase
- Idealne do rozwoju z bazą danych

### Auto-detection
```bash
DATA_PROVIDER=
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```
- Automatycznie wykrywa i używa Supabase jeśli skonfigurowane
- Fallback na mock data jeśli Supabase nie jest dostępne
- Idealne do produkcji

## Struktura Katalogów

```
10xCards/
├── .env                    # Aktualna konfiguracja
├── .config/                # Katalog z konfiguracjami
│   ├── mock.env           # Konfiguracja mock
│   ├── supabase.env       # Konfiguracja Supabase
│   ├── auto.env           # Konfiguracja auto-detection
│   ├── dev.env            # Niestandardowa konfiguracja
│   └── backup_*.env       # Backupy konfiguracji
└── switch-config.sh       # Skrypt przełączania
```

## Bezpieczeństwo

- **Backup automatyczny**: Każda zmiana konfiguracji tworzy backup
- **Katalog `.config/` w `.gitignore`**: Konfiguracje lokalne nie są commitowane
- **Fallback**: Jeśli `.env` nie istnieje, tworzy się domyślna konfiguracja

## Przykłady Użycia

### Scenariusz 1: Rozwój z Mock Data
```bash
# Przełącz na mock dla szybkiego testowania
./switch-config.sh mock

# Uruchom aplikację
npm run dev

# Testuj funkcjonalność bez bazy danych
```

### Scenariusz 2: Rozwój z Supabase
```bash
# Przełącz na Supabase
./switch-config.sh supabase

# Upewnij się, że masz poprawne klucze w .env
# Uruchom aplikację
npm run dev

# Testuj z rzeczywistą bazą danych
```

### Scenariusz 3: Testowanie Event Logging
```bash
# Przełącz na Supabase
./switch-config.sh supabase

# Resetuj bazę danych
./reset-db.sh

# Uruchom serwer
npm run dev

# Testuj logowanie zdarzeń
./test-event-logging.sh
```

### Scenariusz 4: Przywracanie Konfiguracji
```bash
# Sprawdź dostępne backupy
ls .config/backup_*.env

# Przywróć konkretny backup
./switch-config.sh restore backup_20250805_071700.env
```

## Integracja z Innymi Skryptami

Skrypt współpracuje z innymi skryptami w projekcie:

```bash
# Pełny workflow testowania
./switch-config.sh supabase    # Przełącz na Supabase
./reset-db.sh                  # Resetuj bazę danych
npm run dev                    # Uruchom serwer
./test-api-endpoints.sh        # Testuj API
./test-event-logging.sh        # Testuj logowanie zdarzeń
```

## Troubleshooting

### Problem: "Configuration not found"
```bash
# Sprawdź dostępne konfiguracje
./switch-config.sh list

# Utwórz brakującą konfigurację
./switch-config.sh create [name] [type]
```

### Problem: "No .env file to backup"
```bash
# Skrypt automatycznie utworzy .env jeśli nie istnieje
./switch-config.sh list
```

### Problem: Supabase nie działa
```bash
# Przełącz na mock data
./switch-config.sh mock

# Lub sprawdź konfigurację Supabase
cat .env
```

## Uwagi

- **Katalog `.config/`** jest dodany do `.gitignore` - konfiguracje lokalne nie są commitowane
- **Backupy** są tworzone automatycznie przy każdej zmianie konfiguracji
- **Fallback** działa automatycznie - jeśli `.env` nie istnieje, tworzy się domyślna konfiguracja
- **Bezpieczeństwo** - oryginalne klucze Supabase są zachowywane w backupach 