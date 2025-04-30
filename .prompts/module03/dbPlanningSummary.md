<conversation_summary>
<decisions>

1.  Pola specyficzne dla algorytmu SRS (`nextReviewDate`, `interval`, `easeFactor`) zostaną dodane do tabeli `flashcards` w późniejszym etapie rozwoju.
2.  Kolumna `front` w tabeli `flashcards` będzie miała maksymalną długość 250 znaków (`VARCHAR(250)`) i nie będzie mogła być pusta (`NOT NULL`).
3.  Kolumna `back` w tabeli `flashcards` będzie miała maksymalną długość 750 znaków (`VARCHAR(750)`) i nie będzie mogła być pusta (`NOT NULL`).
4.  Logi zdarzeń systemowych będą przechowywane w dedykowanej, osobnej tabeli o nazwie `event_logs`.
5.  Kolumna `created_at` w tabeli `flashcards` będzie automatycznie ustawiana na czas utworzenia rekordu (`DEFAULT NOW()`).
6.  Kolumna `source` w tabeli `flashcards` będzie przechowywać informację o pochodzeniu fiszki i musi akceptować wartości: 'AI', 'manual', 'AI-edited'. Wartość nie może być pusta (`NOT NULL`).
7.  Kolumna `user_id` w tabeli `flashcards` będzie kluczem obcym odnoszącym się do tabeli użytkowników Supabase (`auth.users`), zapewniając relację jeden-do-wielu (jeden użytkownik może mieć wiele fiszek).
8.  Zasady Bezpieczeństwa na Poziomie Wierszy (RLS) muszą zostać wdrożone dla tabeli `flashcards`, aby użytkownicy mogli widzieć i modyfikować wyłącznie swoje własne fiszki.
9.  Zasady Bezpieczeństwa na Poziomie Wierszy (RLS) muszą zostać wdrożone również dla tabeli `event_logs`, aby użytkownicy mieli dostęp tylko do swoich logów zdarzeń.
10. Oryginalny tekst źródłowy, na podstawie którego AI generuje fiszki, nie będzie przechowywany bezpośrednio w tabeli `flashcards`. Zostanie utworzona osobna tabela (`source_texts`) do przechowywania tych tekstów, a fiszki będą z nią powiązane (np. przez klucz obcy).
11. Logowanie zdarzeń w tabeli `event_logs` obejmie również edycję (`card_edited`) i usuwanie (`card_deleted`) fiszek.
12. Zdarzenia tworzenia fiszek w tabeli `event_logs` będą miały bardziej szczegółowe typy, np. 'ai_card_created', 'ai_edited_card_created', 'manual_card_created', aby odróżnić źródło na poziomie typu zdarzenia. Zdarzenie oceny fiszki AI pozostaje 'ai_card_reviewed'.
13. W przyszłości potrzebna będzie możliwość efektywnego wyszukiwania fiszek na podstawie daty następnej powtórki (`nextReviewDate`), co implikuje potrzebę dodania indeksu na tej kolumnie, gdy zostanie ona wprowadzona.
14. Należy stosować standardową konwencję nazewnictwa w bazie danych (małe litery, podkreślniki - snake_case).
15. Do tabeli `flashcards` zostanie dodana kolumna `updated_at`, która będzie automatycznie aktualizowana przy każdej modyfikacji fiszki za pomocą wyzwalacza (trigger).
16. Jako klucze główne (`id`) we wszystkich tabelach (`flashcards`, `event_logs`, `source_texts`) zostaną użyte identyfikatory UUID.
    </decisions>

<matched_recommendations>

1.  Utworzenie centralnej tabeli `flashcards` ze zdefiniowanymi kolumnami: `id` (UUID, PK), `user_id` (UUID, FK do `auth.users`, NOT NULL), `front` (VARCHAR(250), NOT NULL), `back` (VARCHAR(750), NOT NULL), `created_at` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL), `updated_at` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL, z triggerem), `source` (TEXT lub ENUM, NOT NULL, z constraintem 'AI'/'manual'/'AI-edited'). Dodanie klucza obcego do tabeli `source_texts` jest implikowane przez decyzję 10.
2.  Konfiguracja `user_id` w `flashcards` jako klucza obcego do `auth.users`, odzwierciedlająca relację jeden-do-wielu.
3.  Implementacja RLS dla tabeli `flashcards`, ograniczająca dostęp użytkownika tylko do jego danych.
4.  Utworzenie oddzielnej tabeli `event_logs` z kolumnami: `id` (UUID, PK), `user_id` (UUID, FK do `auth.users`, NOT NULL), `event_type` (TEXT, NOT NULL, z constraintem na dozwolone typy zdarzeń: 'ai_card_created', 'ai_edited_card_created', 'manual_card_created', 'ai_card_reviewed', 'card_edited', 'card_deleted'), `timestamp` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL), `payload` (JSONB, do przechowywania dodatkowych danych, np. decyzji z `ai_card_reviewed`).
5.  Implementacja RLS dla tabeli `event_logs`, ograniczająca dostęp użytkownika tylko do jego logów.
6.  Użycie typów `VARCHAR` z określonymi limitami długości oraz constraintu `NOT NULL` dla kolumn `front` i `back`.
7.  Automatyczne ustawianie wartości `created_at` przy tworzeniu rekordu i `updated_at` przy aktualizacji (za pomocą triggera). Dodanie constraintu dla kolumny `source`.
8.  Utworzenie indeksów dla usprawnienia zapytań: `flashcards(user_id)`, `event_logs(user_id)`, `event_logs(event_type)`, `event_logs(timestamp)`. Zaplanowanie przyszłego indeksu dla `flashcards(nextReviewDate)`.
9.  Używanie typu UUID dla wszystkich kluczy głównych.
10. Utworzenie nowej tabeli `source_texts` (np. `id` (UUID, PK), `text_content` (TEXT, NOT NULL), `created_at` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL)) do przechowywania tekstów źródłowych i powiązanie jej z tabelą `flashcards` (najpewniej przez dodanie kolumny `source_text_id` (UUID, FK do `source_texts`, NULL) w tabeli `flashcards`).
    </matched_recommendations>

<database_planning_summary>
Na podstawie dokumentu wymagań produktu (PRD) dla aplikacji 10xCards (MVP), wybranego stacku technologicznego (Supabase/PostgreSQL, Astro, React) oraz przeprowadzonej dyskusji, zaplanowano strukturę bazy danych PostgreSQL.

**Główne wymagania:**

- Obsługa uwierzytelniania użytkowników (realizowana przez Supabase Auth).
- Przechowywanie fiszek tworzonych ręcznie, generowanych przez AI oraz generowanych przez AI i edytowanych przez użytkownika.
- Możliwość zarządzania fiszkami (edycja, usuwanie).
- Przechowywanie danych niezbędnych dla przyszłej implementacji algorytmu SRS (pola zostaną dodane później).
- Logowanie kluczowych zdarzeń systemowych dla celów metryk sukcesu MVP (tworzenie fiszek, ocena fiszek AI, edycja, usuwanie).
- Przechowywanie oryginalnego tekstu źródłowego użytego do generowania fiszek AI w sposób zoptymalizowany (unikanie duplikacji).
- Zapewnienie izolacji danych pomiędzy użytkownikami.

**Kluczowe encje i ich relacje:**

1.  **`users`**: Zarządzana przez Supabase (`auth.users`). Stanowi punkt odniesienia dla własności danych.
2.  **`flashcards`**: Główna tabela przechowująca fiszki. Zawiera `id` (UUID, PK), `user_id` (UUID, FK do `users`), `front` (VARCHAR(250)), `back` (VARCHAR(750)), `created_at`, `updated_at`, `source` ('AI', 'manual', 'AI-edited'), oraz przyszły `source_text_id` (UUID, FK do `source_texts`). Relacja: 1 `user` -> Wiele `flashcards`.
3.  **`source_texts`**: Tabela do przechowywania tekstów źródłowych dla AI. Zawiera `id` (UUID, PK), `text_content` (TEXT), `created_at`. Relacja: 1 `source_text` -> Wiele `flashcards` (poprzez `source_text_id` w `flashcards`).
4.  **`event_logs`**: Tabela do logowania zdarzeń. Zawiera `id` (UUID, PK), `user_id` (UUID, FK do `users`), `event_type` (TEXT, określone typy), `timestamp`, `payload` (JSONB). Relacja: 1 `user` -> Wiele `event_logs`.

**Ważne kwestie dotyczące bezpieczeństwa i skalowalności:**

- **Bezpieczeństwo:** Uwierzytelnianie przez Supabase. Kluczowe jest wdrożenie Zasad Bezpieczeństwa na Poziomie Wierszy (RLS) na tabelach `flashcards` i `event_logs`, aby zapewnić, że użytkownicy mają dostęp wyłącznie do swoich danych. Użycie UUID jako kluczy głównych utrudnia odgadywanie identyfikatorów.
- **Skalowalność:** Użycie UUID jako kluczy głównych. Zastosowanie odpowiednich indeksów (na `user_id`, `event_type`, `timestamp` i w przyszłości `nextReviewDate`) jest kluczowe dla utrzymania wydajności zapytań wraz ze wzrostem ilości danych. Wydzielenie `source_texts` do osobnej tabeli zapobiega redundancji danych i potencjalnym problemom z wydajnością związanym z przechowywaniem dużych tekstów w głównej tabeli fiszek.

</database_planning_summary>

<unresolved_issues>

1.  **Pola SRS:** Należy zdefiniować konkretne kolumny (nazwy, typy danych, wartości domyślne) wymagane przez wybrany algorytm SRS, gdy zostanie on sfinalizowany. Należy również zaplanować indeks na `nextReviewDate`.
2.  **Struktura `payload` w `event_logs`:** Należy dokładniej zdefiniować, jakie konkretne informacje powinny być przechowywane w polu `payload` (JSONB) dla każdego typu zdarzenia (np. dla `card_edited` - czy logować zmienione pola?).
3.  **Relacja `flashcards` - `source_texts`:** Potwierdzenie implementacji relacji poprzez dodanie kolumny `source_text_id` (UUID, FK, NULL) w tabeli `flashcards`, wskazującej na `id` w tabeli `source_texts`. Ta kolumna byłaby wypełniana tylko dla fiszek z `source` 'AI' lub 'AI-edited'.
    </unresolved_issues>
    </conversation_summary>
