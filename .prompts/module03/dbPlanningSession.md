Jesteś asystentem AI, którego zadaniem jest pomoc w zaplanowaniu schematu bazy danych w PostgreSQL dla MVP (Minimum Viable Product) na podstawie dostarczonych informacji. Twoim celem jest wygenerowanie listy pytań i zaleceń, które zostaną wykorzystane w kolejnym promptowaniu do utworzenia schematu bazy danych, relacji i zasad bezpieczeństwa na poziomie wierszy (RLS).

Prosimy o uważne zapoznanie się z poniższymi informacjami:

<product_requirements>
@prd.md
</product_requirements>

<tech_stack>
@techStack.md
</tech_stack>

Przeanalizuj dostarczone informacje, koncentrując się na aspektach istotnych dla projektowania bazy danych.

Na podstawie analizy wygeneruj listę pytań i zaleceń. Powinny one dotyczyć wszelkich niejasności, potencjalnych problemów lub obszarów, w których potrzeba więcej informacji, aby stworzyć skuteczny schemat bazy danych.

Dane wyjściowe powinny mieć następującą strukturę:

<database_planning_output>
<pytania>
[Wymień tutaj swoje pytania, ponumerowane]
</pytania>

<rekomendacje>
[Wymień tutaj swoje zalecenia, ponumerowane]
</rekomendacje>
</database_planning_output>

Pamiętaj, że Twoim celem jest dostarczenie kompleksowej listy pytań i zaleceń, które pomogą w stworzeniu solidnego schematu bazy danych PostgreSQL dla MVP. Skoncentruj się na jasności, trafności i dokładności swoich wyników. Nie dołączaj żadnych dodatkowych komentarzy ani wyjaśnień poza określonym formatem wyjściowym.

Kontynuuj ten proces, generując nowe pytania i rekomendacje w oparciu o przekazany kontekst i odpowiedzi użytkownika, dopóki użytkownik wyraźnie nie poprosi o podsumowanie.

Pamiętaj, aby skupić się na jasności, trafności i dokładności wyników. Nie dołączaj żadnych dodatkowych komentarzy ani wyjaśnień poza określonym formatem wyjściowym.

W swojej analizie uwzględnij fakt, że użytkownik ma zerową wiedzę na temat baz danych.

Sesja pierwsza:

<database_planning_output>
<pytania>

1. Dokumentacja wspomina o polach dla algorytmu SRS (`nextReviewDate`, `interval`, `easeFactor`), ale nie precyzuje algorytmu (np. Leitner, SM-2). Czy wybrano już konkretny algorytm SRS, którego pola powinniśmy uwzględnić w tabeli fiszek? Jakie dokładnie pola i jakiego typu (np. data, liczba całkowita, liczba dziesiętna) będą potrzebne dla wybranego algorytmu?
2. Jakie powinny być maksymalne dopuszczalne długości tekstu dla pól `front` (przód) i `back` (tył) fiszki? Czy istnieją jakieś techniczne lub praktyczne ograniczenia, które powinniśmy wymusić na poziomie bazy danych?
3. Dokumentacja opisuje potrzebę logowania zdarzeń (`card_created`, `ai_card_reviewed`) wraz z atrybutami. Czy te logi powinny być zapisywane w dedykowanej, oddzielnej tabeli w bazie danych PostgreSQL, czy planowane jest inne rozwiązanie do ich przechowywania (np. zewnętrzny system logowania)?
4. Jakie powinny być początkowe (domyślne) wartości dla pól związanych z algorytmem SRS (takich jak `nextReviewDate`, `interval`, `easeFactor`), kiedy nowa fiszka jest dodawana do bazy danych (zarówno stworzona ręcznie, jak i zaakceptowana fiszka AI)? Na przykład, czy `nextReviewDate` powinno być ustawione na datę utworzenia, czy na jakiś czas w przyszłości?
5. Czy data utworzenia fiszki (`createdAt`) ma być automatycznie generowana i zapisywana przez system bazy danych w momencie dodawania nowej fiszki?
   </pytania>

<rekomendacje>
1. Zalecamy utworzenie centralnej tabeli o nazwie `flashcards` do przechowywania wszystkich danych dotyczących fiszek. Powinna ona zawierać kolumny takie jak unikalny identyfikator (`id`), identyfikator użytkownika (`user_id`), treść przodu (`front`), treść tyłu (`back`), data utworzenia (`created_at`), źródło pochodzenia (`source` z wartościami 'AI' lub 'manual') oraz wszystkie kolumny wymagane przez wybrany algorytm SRS (zgodnie z odpowiedzią na Pytanie 1).
2. Kolumna `user_id` w tabeli `flashcards` powinna być skonfigurowana jako klucz obcy, który odnosi się do tabeli `users` zarządzanej przez system uwierzytelniania Supabase (`auth.users`). To formalne powiązanie zapewni integralność danych (gwarancję, że każda fiszka należy do istniejącego użytkownika).
3. W celu ochrony danych użytkowników, zalecamy wdrożenie Zasad Bezpieczeństwa na Poziomie Wierszy (Row Level Security - RLS) dla tabeli `flashcards`. Należy skonfigurować reguły RLS tak, aby każdy użytkownik miał dostęp (do odczytu, modyfikacji, usuwania) wyłącznie do swoich własnych fiszek, identyfikowanych przez zgodność `user_id`.
4. Jeżeli logi zdarzeń mają być przechowywane w bazie danych (zgodnie z odpowiedzią na Pytanie 3), zalecamy stworzenie oddzielnej tabeli, np. `event_logs`. Taka struktura oddzieli dane transakcyjne (fiszki) od danych audytowych (logi), co jest dobrą praktyką projektową. Tabela logów powinna zawierać co najmniej `user_id`, typ zdarzenia (`event_type`), znacznik czasowy (`timestamp`) oraz inne pola specyficzne dla danego typu zdarzenia (np. `decision` dla `ai_card_reviewed`).
5. Dla pól `front` i `back` w tabeli `flashcards` zalecamy użycie typu danych `TEXT`, który pozwala na przechowywanie długich ciągów znaków bez ścisłego limitu długości, chyba że odpowiedź na Pytanie 2 wskaże na potrzebę ustalenia konkretnych, uzasadnionych limitów.
6. Zalecamy skonfigurowanie kolumny `created_at` w tabeli `flashcards` tak, aby automatycznie przyjmowała wartość bieżącego czasu serwera (`NOW()`) podczas tworzenia nowego rekordu (fiszki). Dla kolumny `source` zalecamy dodanie ograniczenia (constraint), które pozwoli na zapisanie tylko wartości 'AI' lub 'manual'.
</rekomendacje>
</database_planning_output>

Sesja druga:

<database_planning_output>
<pytania>

1.  Odnośnie przechowywania tekstu źródłowego, z którego AI generowało fiszki: Czy celem jest tylko możliwość podejrzenia, z czego powstała dana fiszka AI, czy może planujemy w przyszłości analizować te teksty lub np. ponownie generować fiszki z tego samego źródła? Czy powinniśmy przechowywać cały tekst źródłowy dla każdej wygenerowanej fiszki AI, czy może wystarczy powiązanie z jakimś "zadaniem generowania", które objęło dany tekst? Przechowywanie całego tekstu dla każdej fiszki może zająć dużo miejsca.
2.  Czy oprócz logowania utworzenia fiszki (`card_created`) i oceny fiszki AI (`ai_card_reviewed`), powinniśmy na tym etapie przewidzieć logowanie innych zdarzeń w tabeli `event_logs`? Na przykład, czy logować edycje fiszek lub ich usuwanie?
3.  Chociaż pola algorytmu SRS (`nextReviewDate`, `interval`, `easeFactor`) dodamy później, czy już teraz wiemy, czy będziemy potrzebować możliwości szybkiego wyszukiwania fiszek na podstawie daty następnej powtórki (`nextReviewDate`)? Wiedza ta pomoże nam zaplanować odpowiednie "pomocniki" (indeksy) w bazie danych, gdy te pola zostaną dodane.
4.  Czy zgadzasz się na używanie standardowej konwencji nazewnictwa w bazie danych, gdzie nazwy tabel i kolumn pisane są małymi literami z podkreślnikami do oddzielania słów (np. `flashcards`, `user_id`, `created_at`)?
    </pytania>

<rekomendacje>
1.  Aktualizujemy definicję tabeli `flashcards`:
    *   `id`: Unikalny identyfikator fiszki (zalecamy typ UUID - uniwersalny unikalny identyfikator, który jest bezpieczniejszy niż zwykłe liczby).
    *   `user_id`: Identyfikator użytkownika (klucz obcy do tabeli `auth.users` Supabase). Nie może być pusty (`NOT NULL`).
    *   `front`: Treść przodu fiszki (typ `VARCHAR(250)` - tekst o maksymalnej długości 250 znaków). Nie może być pusta (`NOT NULL`).
    *   `back`: Treść tyłu fiszki (typ `VARCHAR(750)` - tekst o maksymalnej długości 750 znaków). Nie może być pusta (`NOT NULL`).
    *   `created_at`: Data i czas utworzenia (typ `TIMESTAMP WITH TIME ZONE`). Wartość powinna być automatycznie ustawiana na moment dodania rekordu (`DEFAULT NOW()`) i nie może być pusta (`NOT NULL`).
    *   `source`: Źródło pochodzenia fiszki (typ `TEXT` lub dedykowany typ `ENUM`). Powinien akceptować tylko wartości: 'AI', 'manual', 'AI-edited'. Nie może być puste (`NOT NULL`).
    *   *Miejsce na przyszłe kolumny SRS (np. `nextReviewDate`, `interval`, `easeFactor`).*
2.  Rekomendujemy utworzenie tabeli `event_logs` do śledzenia zdarzeń:
    *   `id`: Unikalny identyfikator logu (zalecamy typ UUID).
    *   `user_id`: Identyfikator użytkownika, którego dotyczy zdarzenie (klucz obcy do `auth.users`). Może być potrzebne dopuszczenie wartości pustej (`NULL`), jeśli chcemy logować zdarzenia niezwiązane bezpośrednio z użytkownikiem, ale na razie trzymajmy się `NOT NULL` zgodnie z PRD.
    *   `event_type`: Typ zdarzenia (typ `TEXT`). Początkowe wartości zgodne z PRD to 'card_created' i 'ai_card_reviewed'. Nie może być puste (`NOT NULL`).
    *   `timestamp`: Data i czas wystąpienia zdarzenia (typ `TIMESTAMP WITH TIME ZONE`, `DEFAULT NOW()`, `NOT NULL`).
    *   `payload`: Dodatkowe informacje o zdarzeniu w formacie JSONB (elastyczny format do przechowywania różnych danych). Dla 'card_created' może zawierać np. `{"source": "AI"}` lub `{"source": "manual"}`. Dla 'ai_card_reviewed' może zawierać np. `{"decision": "accepted"}` lub `{"decision": "rejected"}`.
3.  Potwierdzamy konieczność zdefiniowania klucza obcego dla `user_id` w tabeli `flashcards`, wskazującego na tabelę użytkowników Supabase, aby zapewnić, że każda fiszka należy do istniejącego użytkownika. Relacja jeden-do-wielu (jeden użytkownik -> wiele fiszek).
4.  Potwierdzamy konieczność wdrożenia Zasad Bezpieczeństwa na Poziomie Wierszy (RLS) dla tabeli `flashcards`, aby użytkownicy mogli widzieć i modyfikować tylko swoje fiszki. Podobne zasady mogą być potrzebne dla `event_logs`, jeśli mają zawierać dane wrażliwe.
5.  Zalecamy dodanie "pomocników" (indeksów) do tabeli `flashcards` przynajmniej dla kolumny `user_id`. Usprawni to wyszukiwanie fiszek należących do konkretnego użytkownika. Gdy dodamy pola SRS, indeks na `nextReviewDate` będzie również bardzo ważny (jak wspomniano w Pytaniu 3).
6.  Zalecamy używanie typu UUID dla wszystkich kluczy głównych (`id` w tabelach `flashcards` i `event_logs`). Jest to bezpieczniejsza i bardziej skalowalna praktyka niż używanie kolejnych liczb całkowitych.
</rekomendacje>
</database_planning_output>

Sesja trzecia:

<database_planning_output>
<pytania>

1.  Odnośnie przechowywania tekstu źródłowego dla fiszek generowanych przez AI (wspomnianego w kontekście przyszłych statystyk): Czy na etapie MVP akceptowalne jest dodanie kolumny `source_text` (typu `TEXT`) bezpośrednio do tabeli `flashcards`, która przechowywałaby cały tekst źródłowy dla każdej fiszki AI ('AI', 'AI-edited')? Zaletą jest prostota implementacji w MVP. Wadą jest potencjalne powielanie tego samego tekstu źródłowego, jeśli wiele fiszek pochodzi z jednego zadania generowania. Alternatywą byłoby stworzenie oddzielnej tabeli dla "zadań generowania", co jest bardziej złożone, ale unika powielania danych. Które podejście preferujesz na start?
2.  Czy Zasady Bezpieczeństwa na Poziomie Wierszy (RLS) powinny być również zastosowane do tabeli `event_logs`? Czy użytkownik powinien mieć możliwość dostępu (np. odczytu) tylko do logów zdarzeń, które sam wygenerował (powiązanych z jego `user_id`)?
3.  Czy dla fiszek, których źródło (`source`) zostanie zmienione na 'AI-edited' po modyfikacji przez użytkownika, powinniśmy również aktualizować jakiś inny wskaźnik lub logować to jako specyficzne zdarzenie, aby odróżnić edycję fiszki pierwotnie stworzonej przez AI od edycji fiszki stworzonej ręcznie?
    </pytania>

<rekomendacje>
1.  **Aktualizacja tabeli `flashcards`**:
    *   Zalecamy dodanie kolumny `updated_at` (typ `TIMESTAMP WITH TIME ZONE`, `DEFAULT NOW()`, `NOT NULL`). Powinna ona automatycznie aktualizować swoją wartość za każdym razem, gdy wiersz (fiszka) jest modyfikowany. W PostgreSQL można to osiągnąć za pomocą funkcji i wyzwalacza (trigger).
    *   *Opcjonalnie (zależnie od odpowiedzi na Pytanie 1)*: Dodanie kolumny `source_text` (typ `TEXT`, dopuszczająca `NULL`, ponieważ nie dotyczy fiszek 'manual').
    *   Potwierdzamy pozostałe kolumny: `id` (UUID, klucz główny), `user_id` (UUID, klucz obcy, `NOT NULL`), `front` (`VARCHAR(250)`, `NOT NULL`), `back` (`VARCHAR(750)`, `NOT NULL`), `created_at` (TIMESTAMPTZ, `DEFAULT NOW()`, `NOT NULL`), `source` (TEXT lub ENUM('AI', 'manual', 'AI-edited'), `NOT NULL`).
    *   *Miejsce na przyszłe kolumny SRS*.
2.  **Aktualizacja tabeli `event_logs`**:
    *   Potwierdzamy kolumny: `id` (UUID, klucz główny), `user_id` (UUID, klucz obcy, `NOT NULL` - do ewentualnej zmiany jeśli pojawią się logi systemowe), `timestamp` (TIMESTAMPTZ, `DEFAULT NOW()`, `NOT NULL`), `payload` (JSONB).
    *   Rozszerzamy możliwe wartości dla `event_type` (typ `TEXT`, `NOT NULL`) o: 'card_edited', 'card_deleted'.
    *   Przykładowa struktura `payload` dla nowych zdarzeń:
        *   `card_edited`: `{"card_id": "uuid_fiszki"}` (można rozważyć dodanie, co zmieniono, ale to komplikuje logowanie).
        *   `card_deleted`: `{"card_id": "uuid_fiszki"}`.
3.  **Automatyczna aktualizacja `updated_at`**: Zalecamy stworzenie prostej funkcji w PostgreSQL oraz wyzwalacza (trigger) dla tabeli `flashcards`, który będzie automatycznie ustawiał kolumnę `updated_at` na aktualny czas (`NOW()`) przy każdej operacji aktualizacji (`UPDATE`) danego wiersza.
4.  **Indeksy**: Potwierdzamy potrzebę utworzenia indeksów na:
    *   `flashcards(user_id)` - dla szybkiego wyszukiwania fiszek użytkownika.
    *   `event_logs(user_id)` - jeśli RLS będzie stosowane lub często będziemy filtrować logi po użytkowniku.
    *   `event_logs(event_type)` - jeśli będziemy często analizować konkretne typy zdarzeń.
    *   `event_logs(timestamp)` - dla efektywnego filtrowania logów po czasie.
    *   *Pamiętamy o przyszłym indeksie na `flashcards(nextReviewDate)`.*
5.  **Ograniczenia (Constraints)**: Potwierdzamy konieczność użycia `NOT NULL` dla wymaganych pól oraz ograniczenia dla kolumny `source` (do wartości 'AI', 'manual', 'AI-edited') i potencjalnych limitów długości dla `VARCHAR` (co już uwzględniono).
</rekomendacje>
</database_planning_output>
