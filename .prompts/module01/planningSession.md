<conversation_summary>

<decisions>
1.  Produkt skierowany jest do ogólnych użytkowników uczących się, bez specjalizacji w konkretnej dziedzinie.
2.  Limit długości tekstu źródłowego dla AI wynosi 1000-10000 znaków.
3.  Interfejs generowania: pole tekstowe, przycisk `Generuj`.
4.  Interfejs przeglądania fiszek: wyświetlanie listy wygenerowanych kart (Przód/Tył) z przyciskami `Edytuj` (edycja inline), `Zatwierdź`, `Odrzuć`.
5.  Fiszki odrzucone są usuwane (nie są przechowywane).
6.  Obsługiwane jest manualne tworzenie fiszek (dodanie pustej karty i wypełnienie).
7.  Do pomiaru sukcesu (75% fiszek z AI) brane są pod uwagę wszystkie fiszki w systemie, co będzie śledzone przez logowanie zdarzeń.
8.  Wskaźnik akceptacji AI poniżej 75% oraz szczegółowe metryki zaangażowania w naukę nie są priorytetem dla MVP.
9.  Kwestie prywatności nie są uznawane za problem na etapie MVP.
10. Do generowania fiszek wstępnie planowane jest użycie modelu typu ChatGPT.
11. Projekt realizowany jest przez jednego programistę frontendowego w czasie wolnym, stack technologiczny zostanie określony później.
12. Aplikacja będzie podzielona na moduły: Generowania (tworzenie/edycja), Nauki (tryb powtórek z SRS) oraz Zarządzania (przeglądanie/edycja/usuwanie zapisanych fiszek).
13. Wygenerowane fiszki przed zatwierdzeniem będą przechowywane w stanie aplikacji (frontend state).
14. Liczba generowanych fiszek (docelowo 3-7) będzie określana przez AI; interfejs pokaże wskaźnik ładowania (spinner) w trakcie generowania.
15. Po zatwierdzeniu lub odrzuceniu fiszka znika z widoku generowania.
16. Walidacja danych wejściowych w MVP ogranicza się do sprawdzania długości tekstu.
17. Nie będzie anonimowego logowania zdarzeń w MVP.
18. Pytania o szczegółowy schemat bazy danych dla SRS i wybór konkretnego stacku technologicznego backendu są odkładane na później.
</decisions>

<matched_recommendations>

1.  Stwórz prototypy (mockupy lub wireframy) interfejsu użytkownika dla kluczowych przepływów, zwłaszcza dla nowo dodanych modułów Nauki i Zarządzania. (Odnosi się do pierwotnej rekomendacji 2)
2.  Dokładnie zbadaj i wybierz konkretny, prosty algorytm powtórek open-source (np. Leitner, uproszczony SM-2) oraz sposób jego integracji _przed_ rozpoczęciem implementacji modułu Nauki. (Odnosi się do pierwotnej rekomendacji 3 i nowej 2)
3.  Mocno rozważ dalsze uproszczenie zakresu MVP, potencjalnie odkładając moduły Nauki i Zarządzania na później, aby skupić się na podstawowej funkcjonalności generowania, edycji i zapisywania fiszek, biorąc pod uwagę ograniczone zasoby (jeden programista, czas wolny). (Odnosi się do pierwotnej rekomendacji 6 i nowej 1)
4.  Przeprowadź wstępne testy z wybranym modelem AI (np. ChatGPT) i różnymi tekstami, aby ocenić jakość generowanych fiszek i dostosować prompty. (Odnosi się do pierwotnej rekomendacji 8 i nowej 5)
5.  Rozważ użycie platformy BaaS (np. Firebase, Supabase) do obsługi backendu (autoryzacja, baza danych), co może znacząco przyspieszyć rozwój dla programisty frontendowego. (Odnosi się do nowej rekomendacji 3)
6.  Zaimplementuj podstawowe mechanizmy obsługi błędów i informacji zwrotnej dla użytkownika (np. wskaźnik ładowania, komunikaty o błędach AI). (Odnosi się do nowej rekomendacji 6)
    </matched_recommendations>

<prd_planning_summary>
Na podstawie rozmowy, PRD dla MVP powinno obejmować następujące elementy:

**a. Główne wymagania funkcjonalne:**
_ Rejestracja i logowanie użytkowników (domniemane z konieczności zapisywania fiszek per użytkownik i pierwotnego opisu, choć nie omówione bezpośrednio w Q&A).
_ **Moduł Generowania:**
_ Interfejs do wklejania tekstu (1000-10000 znaków).
_ Przycisk `Generuj` uruchamiający proces AI (z wizualnym wskaźnikiem ładowania).
_ Wyświetlanie 3-7 wygenerowanych fiszek (Przód/Tył).
_ Możliwość edycji inline treści Przodu i Tyłu każdej fiszki.
_ Przyciski `Zatwierdź` (zapisuje fiszkę w bazie danych i usuwa z widoku) i `Odrzuć` (usuwa fiszkę z widoku).
_ Możliwość ręcznego dodania pustej fiszki i jej wypełnienia.
_ **Moduł Nauki:**
_ Interfejs prezentujący zapisane fiszki zgodnie z wybranym algorytmem SRS.
_ Mechanizm interakcji użytkownika z algorytmem (np. ocena znajomości fiszki).
_ **Moduł Zarządzania:**
_ Widok listy wszystkich zapisanych fiszek użytkownika.
_ Możliwość edycji i usuwania zapisanych fiszek.
_ **Backend/Dane:**
_ Baza danych do przechowywania informacji o użytkownikach i ich fiszkach (minimum: `userId`, `front`, `back`, `createdAt` oraz pola wymagane przez algorytm SRS).
_ Integracja z API modelu AI (np. ChatGPT).
_ Logowanie zdarzeń (tworzenie fiszki AI vs manualnie, akceptacja/odrzucenie fiszki AI) do celów statystycznych.

**b. Kluczowe historie użytkownika i ścieżki korzystania:**
_ Użytkownik rejestruje się/loguje.
_ Użytkownik wkleja tekst i generuje fiszki za pomocą AI.
_ Użytkownik przegląda, edytuje, zatwierdza lub odrzuca wygenerowane fiszki.
_ Użytkownik ręcznie tworzy nową fiszkę.
_ Użytkownik przechodzi do modułu Nauki, aby powtarzać zapisane fiszki zgodnie z algorytmem SRS.
_ Użytkownik przechodzi do modułu Zarządzania, aby przejrzeć, edytować lub usunąć swoje zapisane fiszki.

**c. Ważne kryteria sukcesu i sposoby ich mierzenia:**
_ **Kryterium 1:** Użytkownicy mogą pomyślnie generować (AI/manualnie), przeglądać, edytować, zapisywać, powtarzać (w module Nauki) i zarządzać fiszkami. (Mierzone przez ogólną funkcjonalność aplikacji).
_ **Kryterium 2:** 75% wszystkich utworzonych przez użytkownika fiszek pochodzi z generowania AI. (Mierzone przez logowanie zdarzeń `card_created` z atrybutem `source: AI/manual`). \* **Kryterium 3:** 75% fiszek generowanych przez AI jest akceptowanych przez użytkownika. (Mierzone przez logowanie zdarzeń `ai_card_reviewed` z atrybutem `decision: accepted/rejected`).

**d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia:**
_ Wybór konkretnego algorytmu SRS i szczegóły jego integracji z aplikacją (jakie dane przechowuje, jak wpływa na interfejs modułu Nauki).
_ Wybór technologii backendowej (API, baza danych, autoryzacja) - użytkownik odłożył tę decyzję, ale jest ona kluczowa dla realizacji.
_ Szczegółowy projekt UI/UX dla modułów Nauki i Zarządzania.
_ Dokładny schemat bazy danych, uwzględniający potrzeby algorytmu SRS.
_ Strategia obsługi błędów i długiego czasu odpowiedzi ze strony API AI.
_ Potencjalne ryzyko związane ze zbyt szerokim zakresem MVP (trzy moduły, AI, SRS, Auth, DB) dla jednego programisty pracującego w wolnym czasie. Zalecana jest ponowna ocena priorytetów i ewentualne dalsze uproszczenie zakresu.
</prd_planning_summary>

<unresolved_issues>

1.  Wybór konkretnego algorytmu Spaced Repetition System (SRS) i sposób jego technicznej integracji.
2.  Wybór stacku technologicznego dla backendu (API, baza danych, autoryzacja).
3.  Szczegółowy projekt interfejsu użytkownika (UI/UX) dla modułów Nauki i Zarządzania.
4.  Definicja schematu bazy danych uwzględniającego wymagania SRS.
5.  Strategia obsługi błędów i opóźnień związanych z API AI.
6.  Ryzyko związane z zakresem MVP w kontekście dostępnych zasobów (zalecana rewizja i priorytetyzacja).

</unresolved_issues>

</conversation_summary>
