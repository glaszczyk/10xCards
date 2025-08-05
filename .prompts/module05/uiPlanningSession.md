# Plan implementacji UI - 10xCards

## MVP Components (Required for Initial Release)

## 1. Moduł Uwierzytelniania (Authentication)

### 1.1 Ekran Logowania (`/auth/login`)

- **Komponenty:**
  - `LoginForm` - formularz logowania z polami email i hasło
  - `Button` - przycisk "Zaloguj się"
  - `Input` - pole email z walidacją formatu
  - `Input` - pole hasło z typem password
  - `Link` - link do rejestracji "Nie masz konta? Zarejestruj się"
  - `Alert` - wyświetlanie błędów logowania
  - `Card` - kontener formularza
  - `Label` - etykiety pól
- **API:** Supabase Auth (automatyczne)
- **Stany:** loading podczas logowania, error przy błędnych danych
- **Walidacja:** inline dla formatu email, feedback błędów w Alert

### 1.2 Ekran Rejestracji (`/auth/register`)

- **Komponenty:**
  - `RegisterForm` - formularz rejestracji
  - `Input` - pole email z walidacją
  - `Input` - pole hasło z wymaganiami
  - `Input` - pole potwierdzenie hasła
  - `Button` - przycisk "Zarejestruj się"
  - `Link` - link do logowania "Masz już konto? Zaloguj się"
  - `Alert` - komunikaty błędów i sukcesu
  - `Card` - kontener formularza
  - `Label` - etykiety pól
- **API:** Supabase Auth (automatyczne)
- **Walidacja:** inline dla wszystkich pól, sprawdzenie zgodności haseł
- **Stany:** loading, success, error

### 1.3 Komponent Nawigacji (Navigation)

- **Komponenty:**
  - `NavigationMenu` - główna nawigacja
  - `Button` - przycisk wylogowania
  - `Avatar` - avatar użytkownika
  - `DropdownMenu` - menu użytkownika
- **Funkcje:** przełączanie między modułami, wylogowanie
- **Stany:** active dla aktualnej strony

## 2. Moduł Generowania Fiszki (Flashcard Generation)

### 2.1 Ekran Generowania (`/generate`)

- **Komponenty:**
  - `Textarea` - pole tekstu źródłowego (1000-10000 znaków)
  - `Button` - przycisk "Generuj fiszki"
  - `Card` - kontener główny
  - `Label` - etykieta pola tekstowego
  - `Badge` - licznik znaków
  - `Alert` - komunikaty błędów
  - `Spinner` - wskaźnik ładowania podczas generowania
- **Layout:** Po wygenerowaniu - dwukolumnowy układ z tekstem źródłowym i fiszkami
- **API:** `POST /api/v1/source-texts`, `POST /api/v1/flashcards`
- **Tabele:** `source_texts`, `flashcards`, `event_logs`
- **Walidacja:** inline dla długości tekstu, dezaktywacja przycisku poza limitami
- **Stany:** idle, generating, success (z tekstem źródłowym), error

### 2.2 Lista Wygenerowanych Fiszki (GeneratedFlashcardsList)

- **Komponenty:**
  - `Card` - kontener każdej fiszki
  - `Textarea` - edytowalne pola front/back
  - `Button` - przycisk "Zatwierdź"
  - `Button` - przycisk "Odrzuć"
  - `Button` - przycisk "Edytuj"
  - `Badge` - oznaczenie źródła (AI)
  - `Separator` - separator między fiszkami
- **API:** `POST /api/v1/flashcards`, `POST /api/v1/event-logs`
- **Tabele:** `flashcards`, `event_logs`
- **Stany:** viewing, editing, saving, error
- **Walidacja:** inline dla długości pól front/back

### 2.3 Komponent Wyświetlania Tekstu Źródłowego (SourceTextDisplay)

- **Komponenty:**
  - `Card` - kontener tekstu źródłowego
  - `ScrollArea` - przewijanie długiego tekstu
  - `Text` - wyświetlanie treści źródłowej
  - `Badge` - licznik znaków tekstu
  - `Button` - przycisk "Zwiń/Rozwiń" (opcjonalny)
- **Funkcje:**
  - Wyświetlanie oryginalnego tekstu dla referencji podczas recenzji fiszek
  - Umożliwienie weryfikacji jakości generowania AI
  - Zachowanie tekstu źródłowego po wygenerowaniu fiszek
- **Stany:** collapsed, expanded
- **Pozycja:** Obok listy wygenerowanych fiszek (layout dwukolumnowy lub accordion)

### 2.4 Komponent Ręcznego Dodawania Fiszki (ManualFlashcardForm)

- **Komponenty:**
  - `Button` - przycisk "+ Dodaj fiszkę"
  - `Card` - kontener nowej fiszki
  - `Textarea` - pola front/back
  - `Button` - przycisk "Zapisz"
  - `Button` - przycisk "Anuluj"
- **API:** `POST /api/v1/flashcards`
- **Tabele:** `flashcards`, `event_logs`
- **Stany:** hidden, visible, editing, saving
- **Walidacja:** wymagane pola, długość tekstu

## 3. Moduł Nauki (Learning)

### 3.1 Ekran Sesji Nauki (`/learn`)

- **Komponenty:**
  - `Card` - kontener fiszki do nauki
  - `Button` - przycisk "Pokaż odpowiedź"
  - `Button` - przyciski oceny ("Łatwe", "Trudne", "Powtórz")
  - `Progress` - pasek postępu sesji
  - `Badge` - licznik fiszek w sesji
  - `Alert` - komunikat końca sesji
- **API:** `GET /api/v1/flashcards` (z filtrowaniem SRS), `PATCH /api/v1/flashcards/:id`
- **Tabele:** `flashcards` (pola SRS: next_review_at, interval, ease_factor)
- **Stany:** showing_front, showing_back, evaluating, session_complete
- **Algorytm:** SRS (Leitner lub SM-2)

## 4. Moduł Zarządzania (Management)

### 4.1 Ekran Listy Fiszki (`/manage`)

- **Komponenty:**
  - `Card` - lista fiszek (jedna pod drugą)
  - `FlashcardCard` - wyświetlanie front/back każdej fiszki
  - `Button` - przycisk "Edytuj" dla każdej fiszki
  - `Button` - przycisk "Usuń" dla każdej fiszki
  - `Badge` - oznaczenie źródła (AI/manual)
  - `Button` - przycisk "Dodaj fiszkę" (na górze)
- **API:** `GET /api/v1/flashcards` (podstawowe, bez filtrów)
- **Tabele:** `flashcards`
- **Stany:** loading, loaded, error
- **Funkcje:** podstawowe wyświetlanie, edycja, usuwanie

### 4.2 Komponent Edycji Fiszki (EditFlashcardModal)

- **Komponenty:**
  - `Dialog` - modal edycji
  - `Textarea` - pola front/back
  - `Button` - przycisk "Zapisz zmiany"
  - `Button` - przycisk "Anuluj"
  - `Label` - etykiety pól
- **API:** `PATCH /api/v1/flashcards/:id`, `POST /api/v1/event-logs`
- **Tabele:** `flashcards`, `event_logs`
- **Stany:** open, editing, saving, error
- **Walidacja:** inline dla długości pól

### 4.3 Komponent Usuwania Fiszki (DeleteFlashcardDialog)

- **Komponenty:**
  - `AlertDialog` - dialog potwierdzenia
  - `Button` - przycisk "Usuń"
  - `Button` - przycisk "Anuluj"
  - `Text` - komunikat potwierdzenia
- **API:** `DELETE /api/v1/flashcards/:id`, `POST /api/v1/event-logs`
- **Tabele:** `flashcards`, `event_logs`
- **Stany:** open, deleting, error

## 5. Moduł Obsługi Błędów (Error Handling)

### 5.1 Komponent Globalnego Błędu (ErrorBoundary)

- **Komponenty:**
  - `Alert` - komunikat błędu
  - `Button` - przycisk "Spróbuj ponownie"
  - `Button` - przycisk "Wróć do głównej"
- **Stany:** error, retrying

### 5.2 Komponent Uniwersalny Błędów (UniversalError)

- **Komponenty:**
  - `Card` - kontener błędu
  - `Text` - komunikat błędu (dinamiczny)
  - `Button` - przycisk główny (dinamiczny tekst)
  - `Button` - przycisk pomocniczy (opcjonalny)
- **Props:**
  - `errorType` - typ błędu ('404', '500', 'network', 'generic')
  - `message` - opcjonalny niestandardowy komunikat
  - `showRetry` - czy pokazać przycisk "Spróbuj ponownie"
- **Funkcje:** Jeden komponent obsługuje wszystkie błędy HTTP i sieciowe

## 6. Komponenty Wspólne (Shared Components)

### 6.1 Komponent Layout (Layout)

- **Komponenty:**
  - `Header` - nagłówek z nawigacją
  - `Main` - główna treść
  - `Footer` - stopka (opcjonalny)
- **Funkcje:** podstawowa nawigacja, struktura aplikacji

### 6.2 Komponent Loading (LoadingSpinner)

- **Komponenty:**
  - `Spinner` - animacja ładowania
  - `Text` - komunikat ładowania
- **Warianty:** inline, button

### 6.3 Komponent Toast (Toast)

- **Komponenty:**
  - `Toast` - powiadomienie
  - `Button` - przycisk zamknięcia
- **Typy:** success, error (tylko podstawowe feedback)
- **Cel:** Informowanie o wyniku operacji (zapisano fiszkę, błąd generowania AI)

### 6.4 Komponent Modal (Modal)

- **Komponenty:**
  - `Dialog` - kontener modala
  - `Button` - przycisk zamknięcia
  - `Overlay` - tło modala
- **Funkcje:** focus trap, escape key, click outside

## 7. Komponenty Formularzy (Form Components)

### 7.1 Komponent Walidacji (FormValidation)

- **Komponenty:**
  - `Text` - komunikaty błędów
  - `Badge` - status walidacji
- **Funkcje:** walidacja inline, real-time validation

## 8. Komponenty Kart (Card Components)

### 8.1 Komponent FlashcardCard (FlashcardCard)

- **Komponenty:**
  - `Card` - kontener fiszki
  - `CardHeader` - nagłówek z metadanymi
  - `CardContent` - treść front/back
  - `CardFooter` - akcje
  - `Badge` - źródło fiszki
  - `Text` - timestamp
- **Stany:** collapsed, expanded, editing

---

## After MVP (Post-Launch Features)

### Komponenty i Moduły do implementacji po MVP:

## 11. Moduł Dashboard (Dashboard)

### 11.1 Ekran Główny (`/dashboard`)

- **Komponenty:**
  - `Card` - karty statystyk
  - `Badge` - liczba fiszek AI
  - `Badge` - liczba fiszek ręcznych
  - `Badge` - fiszki do powtórki
  - `Progress` - postęp nauki
  - `Button` - szybkie akcje (Generuj, Ucz się, Zarządzaj)
  - `Chart` - wykres aktywności (opcjonalny)
- **API:** `GET /api/v1/flashcards` (z agregacją), `GET /api/v1/event-logs`
- **Tabele:** `flashcards`, `event_logs`
- **Stany:** loading, loaded, error

### 11.2 Komponent Ostatniej Aktywności (RecentActivity)

- **Komponenty:**
  - `Card` - kontener aktywności
  - `List` - lista ostatnich zdarzeń
  - `Badge` - typ zdarzenia
  - `Text` - opis zdarzenia
  - `Text` - timestamp
- **API:** `GET /api/v1/event-logs` (z limitem)
- **Tabele:** `event_logs`
- **Stany:** loading, loaded, empty

## 12. Moduł Ustawień (Settings)

### 12.1 Ekran Ustawień (`/settings`)

- **Komponenty:**
  - `Tabs` - zakładki ustawień
  - `Card` - kontenery sekcji
  - `Input` - pole email
  - `Button` - przycisk "Zapisz zmiany"
  - `Switch` - przełączniki opcji
  - `Select` - wybór algorytmu SRS
  - `Alert` - komunikaty sukcesu/błędu
- **API:** Supabase Auth (profil), `PATCH /api/v1/users` (jeśli potrzebne)
- **Tabele:** `auth.users`
- **Stany:** loading, saving, success, error

### 12.2 Komponent Zmiany Hasła (ChangePasswordForm)

- **Komponenty:**
  - `Input` - obecne hasło
  - `Input` - nowe hasło
  - `Input` - potwierdzenie nowego hasła
  - `Button` - przycisk "Zmień hasło"
  - `Alert` - komunikaty
- **API:** Supabase Auth
- **Walidacja:** inline dla wymagań hasła, zgodności potwierdzenia

## 13. Komponent Statystyk Nauki (LearningStats)

- **Komponenty:**
  - `Card` - kontener statystyk
  - `Progress` - postęp dzienny
  - `Badge` - liczba fiszek do powtórki
  - `Badge` - liczba fiszek opanowanych
  - `Chart` - wykres postępu (opcjonalny)
- **API:** `GET /api/v1/flashcards` (z agregacją)
- **Tabele:** `flashcards`
- **Stany:** loading, loaded, error

## 14. Komponent StatCard (StatCard)

- **Komponenty:**
  - `Card` - kontener statystyki
  - `Text` - tytuł
  - `Text` - wartość
  - `Icon` - ikona
  - `Progress` - pasek postępu (opcjonalny)

## 15. Komponent Upload (FileUpload)

- **Komponenty:**
  - `Input` - pole file
  - `Button` - przycisk wyboru pliku
  - `Progress` - pasek postępu
  - `Text` - nazwa pliku
- **Funkcje:** drag & drop, preview, walidacja typów

## 16. Komponent Breadcrumbs (Breadcrumbs)

- **Komponenty:**
  - `Breadcrumb` - lista ścieżki
  - `Link` - linki nawigacyjne
  - `Separator` - separator między elementami

## 17. Komponenty Nawigacji Zaawansowanej (Advanced Navigation)

### 17.1 Komponent Pagination (Pagination)

- **Komponenty:**
  - `Button` - przyciski nawigacji
  - `Select` - wybór liczby elementów
  - `Text` - informacja o stronie
- **API:** wszystkie endpointy z paginacją

## 18. Komponenty Tabel (Table Components)

### 18.1 Komponent DataTable (DataTable)

- **Komponenty:**
  - `Table` - główna tabela
  - `TableHeader` - nagłówek
  - `TableRow` - wiersze
  - `TableCell` - komórki
  - `TableSort` - sortowanie kolumn
  - `TableFilter` - filtrowanie
- **Funkcje:** sortowanie, filtrowanie, paginacja, selection

### 18.2 Komponent TableActions (TableActions)

- **Komponenty:**
  - `DropdownMenu` - menu akcji
  - `Button` - przyciski akcji
  - `Icon` - ikony akcji
- **Akcje:** edit, delete, duplicate, export

## 19. Zaawansowane Zarządzanie Fiszkami (Advanced Management)

### 19.1 Komponent Wyszukiwania (SearchInput)

- **Komponenty:**
  - `Input` - pole wyszukiwania
  - `Icon` - ikona szukania
  - `Button` - przycisk wyczyść
- **Funkcje:** wyszukiwanie po treści fiszek

### 19.2 Komponent Filtrów (FilterControls)

- **Komponenty:**
  - `Select` - filtr po źródle (AI/manual)
  - `Select` - sortowanie (data utworzenia, aktualizacji)
  - `Button` - resetuj filtry
- **Funkcje:** zaawansowane filtrowanie i sortowanie

## 20. Komponenty Wykresów (Chart Components)

### 20.1 Komponent ActivityChart (ActivityChart)

- **Komponenty:**
  - `Chart` - wykres aktywności
  - `Legend` - legenda
  - `Tooltip` - tooltip z danymi
- **Dane:** z `event_logs` tabeli
- **Typy:** line, bar, area

### 20.2 Komponent ProgressChart (ProgressChart)

- **Komponenty:**
  - `Chart` - wykres postępu
  - `Progress` - pasek postępu
  - `Text` - procent ukończenia
- **Dane:** z `flashcards` tabeli (pola SRS)

## 14. Komponenty Powiadomień (Notification Components)

### 14.1 Komponent NotificationCenter (NotificationCenter)

- **Komponenty:**
  - `Popover` - kontener powiadomień
  - `List` - lista powiadomień
  - `Badge` - licznik nieprzeczytanych
  - `Button` - przycisk "Oznacz jako przeczytane"
- **API:** `GET /api/v1/notifications` (jeśli implementowane)

### 14.2 Komponent NotificationItem (NotificationItem)

- **Komponenty:**
  - `Card` - kontener powiadomienia
  - `Text` - treść powiadomienia
  - `Text` - timestamp
  - `Button` - przycisk akcji
  - `Badge` - typ powiadomienia

## 15. Komponenty Pomocy (Help Components)

### 15.1 Komponent HelpModal (HelpModal)

- **Komponenty:**
  - `Dialog` - modal pomocy
  - `Tabs` - zakładki sekcji pomocy
  - `Text` - treść pomocy
  - `Video` - filmiki instruktażowe (opcjonalne)
- **Sekcje:** generowanie, nauka, zarządzanie, ustawienia

### 15.2 Komponent Tooltip (Tooltip)

- **Komponenty:**
  - `Tooltip` - kontener tooltip
  - `Text` - treść tooltip
  - `Icon` - ikona pomocy
- **Funkcje:** hover, focus, keyboard navigation

## 16. Komponenty Dostępności (Accessibility Components)

### 16.1 Komponent SkipLink (SkipLink)

- **Komponenty:**
  - `Link` - link pomijania nawigacji
- **Funkcje:** keyboard navigation, screen reader support

### 16.2 Komponent FocusTrap (FocusTrap)

- **Komponenty:**
  - `div` - kontener z focus trap
- **Funkcje:** trap focus w modalach, keyboard navigation

## 17. Komponenty Responsywności (Responsive Components)

### 17.1 Komponent MobileMenu (MobileMenu)

- **Komponenty:**
  - `Sheet` - boczne menu mobilne
  - `NavigationMenu` - menu nawigacji
  - `Button` - przycisk zamknięcia
- **Funkcje:** slide in/out, touch gestures

### 17.2 Komponent ResponsiveTable (ResponsiveTable)

- **Komponenty:**
  - `Card` - karty zamiast wierszy tabeli
  - `List` - lista elementów
  - `Button` - przyciski akcji
- **Funkcje:** adaptacja do małych ekranów

## 18. Komponenty Animacji (Animation Components)

### 18.1 Komponent FadeIn (FadeIn)

- **Komponenty:**
  - `motion.div` - animowany kontener
- **Funkcje:** fade in animation, stagger children

### 18.2 Komponent SlideIn (SlideIn)

- **Komponenty:**
  - `motion.div` - animowany kontener
- **Funkcje:** slide in animation, direction variants

## 19. Komponenty Testowania (Testing Components)

### 19.1 Komponent TestMode (TestMode)

- **Komponenty:**
  - `Badge` - oznaczenie trybu testowego
  - `Button` - przycisk resetowania danych
  - `Alert` - ostrzeżenie o trybie testowym
- **Funkcje:** mock data, reset state

### 19.2 Komponent DebugPanel (DebugPanel)

- **Komponenty:**
  - `Card` - kontener debug
  - `Text` - informacje debug
  - `Button` - przyciski akcji debug
- **Funkcje:** log state, performance metrics

## 20. Komponenty Onboarding (Onboarding Components)

### 20.1 Komponent WelcomeTour (WelcomeTour)

- **Komponenty:**
  - `Dialog` - modal powitalny
  - `Button` - przyciski nawigacji
  - `Progress` - pasek postępu tour
  - `Text` - treść kroków
- **Kroki:** wprowadzenie, generowanie, nauka, zarządzanie

### 20.2 Komponent FeatureHighlight (FeatureHighlight)

- **Komponenty:**
  - `Popover` - highlight funkcji
  - `Text` - opis funkcji
  - `Button` - przycisk "Rozumiem"
- **Funkcje:** highlight elementów, tooltip positioning

## 21. Komponenty Eksportu (Export Components)

### 21.1 Komponent ExportModal (ExportModal)

- **Komponenty:**
  - `Dialog` - modal eksportu
  - `Select` - wybór formatu (CSV, JSON)
  - `Select` - wybór zakresu (wszystkie, wybrane)
  - `Button` - przycisk "Eksportuj"
  - `Progress` - pasek postępu
- **API:** `GET /api/v1/flashcards/export` (jeśli implementowane)

### 21.2 Komponent ImportModal (ImportModal)

- **Komponenty:**
  - `Dialog` - modal importu
  - `FileUpload` - upload pliku
  - `Button` - przycisk "Importuj"
  - `Alert` - komunikaty walidacji
- **API:** `POST /api/v1/flashcards/import` (jeśli implementowane)

## 22. Komponenty Backup (Backup Components)

### 22.1 Komponent BackupSettings (BackupSettings)

- **Komponenty:**
  - `Card` - kontener ustawień
  - `Switch` - automatyczny backup
  - `Select` - częstotliwość backup
  - `Button` - przycisk "Utwórz backup"
  - `Button` - przycisk "Przywróć z backup"
- **API:** `POST /api/v1/backup`, `GET /api/v1/backup` (jeśli implementowane)

## 23. Komponenty Synchronizacji (Sync Components)

### 23.1 Komponent SyncStatus (SyncStatus)

- **Komponenty:**
  - `Badge` - status synchronizacji
  - `Icon` - ikona statusu
  - `Text` - komunikat statusu
  - `Button` - przycisk "Synchronizuj"
- **Stany:** synced, syncing, error, offline

## 24. Komponenty Metryk (Metrics Components)

### 24.1 Komponent UserMetrics (UserMetrics)

- **Komponenty:**
  - `Card` - kontener metryk
  - `Chart` - wykres aktywności
  - `StatCard` - karty statystyk
  - `Text` - opis metryk
- **API:** `GET /api/v1/event-logs` (z agregacją)
- **Dane:** liczba fiszek, akceptacja AI, postęp nauki

## 25. Komponenty Feedback (Feedback Components)

### 25.1 Komponent FeedbackForm (FeedbackForm)

- **Komponenty:**
  - `Dialog` - modal feedback
  - `Textarea` - pole komentarza
  - `Select` - typ feedback
  - `Button` - przycisk "Wyślij"
  - `Rating` - ocena aplikacji
- **API:** `POST /api/v1/feedback` (jeśli implementowane)

### 25.2 Komponent BugReport (BugReport)

- **Komponenty:**
  - `Dialog` - modal raportu błędu
  - `Textarea` - opis błędu
  - `Input` - kroki reprodukcji
  - `Button` - przycisk "Wyślij raport"
  - `Text` - informacje systemowe
- **API:** `POST /api/v1/bug-report` (jeśli implementowane)

## 26. Komponenty Wsparcia (Support Components)

### 26.1 Komponent SupportChat (SupportChat)

- **Komponenty:**
  - `Popover` - kontener czatu
  - `Textarea` - pole wiadomości
  - `Button` - przycisk "Wyślij"
  - `List` - historia wiadomości
- **API:** `POST /api/v1/support/message` (jeśli implementowane)

### 26.2 Komponent FAQ (FAQ)

- **Komponenty:**
  - `Accordion` - lista pytań
  - `Text` - pytania i odpowiedzi
  - `Search` - wyszukiwanie w FAQ
- **Dane:** statyczne FAQ lub z API

## 27. Komponenty Powiadomień Push (Push Notification Components)

### 27.1 Komponent NotificationSettings (NotificationSettings)

- **Komponenty:**
  - `Card` - kontener ustawień
  - `Switch` - powiadomienia push
  - `Switch` - powiadomienia email
  - `Select` - częstotliwość powiadomień
  - `Button` - przycisk "Zapisz"
- **API:** `PATCH /api/v1/users/notification-settings` (jeśli implementowane)

### 27.2 Komponent NotificationPermission (NotificationPermission)

- **Komponenty:**
  - `Alert` - prośba o uprawnienia
  - `Button` - przycisk "Zezwól"
  - `Button` - przycisk "Później"
- **Funkcje:** request permission, handle response

## 28. Komponenty Offline (Offline Components)

### 28.1 Komponent OfflineIndicator (OfflineIndicator)

- **Komponenty:**
  - `Alert` - komunikat offline
  - `Icon` - ikona offline
  - `Text` - status połączenia
- **Stany:** online, offline, reconnecting

### 28.2 Komponent OfflineQueue (OfflineQueue)

- **Komponenty:**
  - `Card` - kontener kolejki
  - `List` - lista akcji offline
  - `Button` - przycisk "Synchronizuj"
  - `Progress` - pasek synchronizacji
- **Funkcje:** queue actions, sync when online

## 29. Komponenty Bezpieczeństwa (Security Components)

### 29.1 Komponent TwoFactorAuth (TwoFactorAuth)

- **Komponenty:**
  - `Dialog` - modal 2FA
  - `Input` - pole kodu
  - `Button` - przycisk "Weryfikuj"
  - `QRCode` - kod QR (jeśli potrzebny)
- **API:** Supabase Auth 2FA

### 29.2 Komponent SessionManager (SessionManager)

- **Komponenty:**
  - `Card` - kontener sesji
  - `List` - lista aktywnych sesji
  - `Button` - przycisk "Wyloguj ze wszystkich"
  - `Button` - przycisk "Wyloguj z tego urządzenia"
- **API:** `GET /api/v1/sessions`, `DELETE /api/v1/sessions/:id`

## 30. Komponenty Personalizacji (Personalization Components)

### 30.1 Komponent ThemeSwitcher (ThemeSwitcher)

- **Komponenty:**
  - `Button` - przycisk przełączania
  - `Icon` - ikona motywu
  - `DropdownMenu` - wybór motywu
- **Motyw:** light, dark, system

### 30.2 Komponent LanguageSwitcher (LanguageSwitcher)

- **Komponenty:**
  - `Select` - wybór języka
  - `Flag` - flaga kraju
  - `Text` - nazwa języka
- **Języki:** polski, angielski (rozszerzalne)

## 31. Komponenty Gamifikacji (Gamification Components)

### 31.1 Komponent Achievements (Achievements)

- **Komponenty:**
  - `Card` - kontener osiągnięć
  - `Badge` - odznaki
  - `Progress` - postęp do osiągnięcia
  - `Text` - opis osiągnięcia
- **API:** `GET /api/v1/achievements` (jeśli implementowane)

### 31.2 Komponent Leaderboard (Leaderboard)

- **Komponenty:**
  - `Card` - kontener rankingu
  - `List` - lista użytkowników
  - `Badge` - pozycja w rankingu
  - `Text` - punkty/statystyki
- **API:** `GET /api/v1/leaderboard` (jeśli implementowane)

## 32. Komponenty Integracji (Integration Components)

### 32.1 Komponent CalendarIntegration (CalendarIntegration)

- **Komponenty:**
  - `Card` - kontener integracji
  - `Button` - przycisk "Połącz z kalendarzem"
  - `Calendar` - widok kalendarza
  - `Event` - wydarzenia nauki
- **API:** Google Calendar API, Outlook API

### 32.2 Komponent CloudSync (CloudSync)

- **Komponenty:**
  - `Card` - kontener synchronizacji
  - `Button` - przycisk "Połącz z Google Drive"
  - `Button` - przycisk "Połącz z Dropbox"
  - `Progress` - pasek synchronizacji
- **API:** Google Drive API, Dropbox API

## 33. Komponenty AI (AI Components)

### 33.1 Komponent AISettings (AISettings)

- **Komponenty:**
  - `Card` - kontener ustawień AI
  - `Select` - wybór modelu AI
  - `Input` - klucz API
  - `Switch` - auto-generowanie
  - `Button` - przycisk "Testuj połączenie"
- **API:** OpenRouter.ai API

### 33.2 Komponent AIPreview (AIPreview)

- **Komponenty:**
  - `Card` - kontener podglądu
  - `Text` - podgląd generowania
  - `Button` - przycisk "Generuj podgląd"
  - `Spinner` - wskaźnik ładowania
- **API:** `POST /api/v1/ai/preview`

## 34. Komponenty Eksperymentalne (Experimental Components)

### 34.1 Komponent VoiceInput (VoiceInput)

- **Komponenty:**
  - `Button` - przycisk nagrywania
  - `Icon` - ikona mikrofonu
  - `Text` - transkrypcja
  - `Progress` - pasek nagrywania
- **API:** Web Speech API

### 34.2 Komponent ARFlashcards (ARFlashcards)

- **Komponenty:**
  - `Canvas` - canvas AR
  - `Button` - przycisk "Uruchom AR"
  - `Text` - instrukcje AR
- **API:** WebXR API (eksperymentalne)

## 35. Komponenty Administracyjne (Admin Components)

### 35.1 Komponent AdminDashboard (AdminDashboard)

- **Komponenty:**
  - `Card` - karty statystyk systemu
  - `Chart` - wykresy użycia
  - `DataTable` - tabela użytkowników
  - `Button` - akcje administracyjne
- **API:** `GET /api/v1/admin/stats`, `GET /api/v1/admin/users`
- **Role:** admin

### 35.2 Komponent UserManagement (UserManagement)

- **Komponenty:**
  - `DataTable` - tabela użytkowników
  - `Button` - akcje użytkowników
  - `Dialog` - modal edycji użytkownika
  - `Select` - zmiana roli
- **API:** `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`
- **Role:** admin

## 36. Komponenty Monitorowania (Monitoring Components)

### 36.1 Komponent SystemHealth (SystemHealth)

- **Komponenty:**
  - `Card` - karty statusu
  - `Badge` - status usług
  - `Progress` - wykorzystanie zasobów
  - `Chart` - wykresy wydajności
- **API:** `GET /api/v1/health`, `GET /api/v1/admin/metrics`
- **Role:** admin

### 36.2 Komponent ErrorLogs (ErrorLogs)

- **Komponenty:**
  - `DataTable` - tabela błędów
  - `Button` - akcje na błędach
  - `Dialog` - szczegóły błędu
  - `Select` - filtry błędów
- **API:** `GET /api/v1/admin/errors`
- **Role:** admin

## 37. Komponenty Dokumentacji (Documentation Components)

### 37.1 Komponent APIDocs (APIDocs)

- **Komponenty:**
  - `Tabs` - zakładki endpointów
  - `Code` - przykłady kodu
  - `Button` - przycisk "Testuj endpoint"
  - `Text` - opis API
- **API:** Swagger/OpenAPI docs

### 37.2 Komponent Changelog (Changelog)

- **Komponenty:**
  - `List` - lista zmian
  - `Badge` - typ zmiany
  - `Text` - opis zmiany
  - `Text` - data zmiany
- **Dane:** statyczne lub z API

## 38. Komponenty Współpracy (Collaboration Components)

### 38.1 Komponent ShareDeck (ShareDeck)

- **Komponenty:**
  - `Dialog` - modal udostępniania
  - `Input` - pole email
  - `Select` - uprawnienia
  - `Button` - przycisk "Udostępnij"
  - `Link` - link do udostępnienia
- **API:** `POST /api/v1/decks/:id/share`

### 38.2 Komponent CollaborativeEditing (CollaborativeEditing)

- **Komponenty:**
  - `Card` - kontener edycji
  - `Textarea` - współdzielone pole
  - `Badge` - status synchronizacji
  - `List` - lista współpracowników
- **API:** WebSocket dla real-time collaboration

## 39. Komponenty Analizy (Analytics Components)

### 39.1 Komponent LearningAnalytics (LearningAnalytics)

- **Komponenty:**
  - `Chart` - wykresy nauki
  - `Card` - karty metryk
  - `Select` - filtry czasowe
  - `Button` - eksport danych
- **API:** `GET /api/v1/analytics/learning`

### 39.2 Komponent PerformanceMetrics (PerformanceMetrics)

- **Komponenty:**
  - `Chart` - wykresy wydajności
  - `Progress` - paski postępu
  - `Text` - rekomendacje
  - `Button` - szczegóły
- **API:** `GET /api/v1/analytics/performance`

## 40. Komponenty Przyszłościowe (Future Components)

### 40.1 Komponent VRMode (VRMode)

- **Komponenty:**
  - `Canvas` - canvas VR
  - `Button` - przycisk "Uruchom VR"
  - `Text` - instrukcje VR
- **API:** WebVR API (przyszłościowe)

### 40.2 Komponent BlockchainIntegration (BlockchainIntegration)

- **Komponenty:**
  - `Card` - kontener blockchain
  - `Button` - przycisk "Połącz portfel"
  - `Text` - status połączenia
  - `Badge` - tokeny użytkownika
- **API:** Web3.js, MetaMask API

---

## Podsumowanie

### MVP (Minimum Viable Product)

Plan MVP obejmuje **8 głównych modułów** z **~24 kluczowymi komponentami** pokrywającymi wszystkie wymagania z PRD:

**MVP Components:**

1. **Moduł Uwierzytelniania** - logowanie, rejestracja, nawigacja
2. **Moduł Generowania Fiszki** - generowanie AI, wyświetlanie tekstu źródłowego, edycja, ręczne dodawanie
3. **Moduł Nauki** - sesja nauki z algorytmem SRS
4. **Moduł Zarządzania** - lista, edycja, usuwanie fiszek
5. **Obsługa Błędów** - error boundary, uniwersalny komponent błędów
6. **Komponenty Wspólne** - layout, loading, toast, modal
7. **Walidacja Formularzy** - inline validation
8. **Karty** - FlashcardCard do wyświetlania fiszek

### After MVP (Post-Launch Features)

**35+ dodatkowych modułów** z zaawansowanymi funkcjami:

- Dashboard z statystykami
- Ustawienia użytkownika
- Zaawansowane statystyki nauki
- **Zaawansowane zarządzanie fiszkami** (wyszukiwanie, filtrowanie, sortowanie, paginacja)
- **DataTable z zaawansowanymi funkcjami** (sortowanie kolumn, filtry, selekcja)
- **Pagination i nawigacja zaawansowana**
- **Dedykowane komponenty błędów** (osobne dla 404, 500, network errors z custom komunikatami)
- **Rozszerzone toasty** (warning, info, różne style, pozycjonowanie, auto-hide)
- Upload plików
- Breadcrumbs nawigacja
- Wykresy i wizualizacje
- Powiadomienia
- Funkcje pomocnicze
- Dostępność
- Responsywność mobilna
- Animacje
- Gamifikacja
- Integracje zewnętrzne
- Funkcje administracyjne
- Komponenty eksperymentalne

**Charakterystyka komponentów:**

- Wykorzystują bibliotekę `shadcn/ui`
- Mają zdefiniowane stany (loading, error, success)
- Obsługują walidację inline w MVP
- Są dostępne (a11y) - rozszerzone po MVP
- Mają powiązanie z API i bazą danych
- MVP skupia się na desktop, responsywność po MVP

Plan jest gotowy do implementacji w Astro z React komponentami, zgodnie ze stackiem technologicznym projektu. **MVP koncentruje się na weryfikacji podstawowych założeń produktu bez zagłębiania się w nieistotne detale.**
