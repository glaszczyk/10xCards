# Dokument wymagań produktu (PRD) - 10xCards (proponowana nazwa)

## 1. Przegląd produktu

Aplikacja 10xCards (nazwa robocza) ma na celu zrewolucjonizowanie procesu tworzenia fiszek do nauki poprzez automatyzację generowania ich treści za pomocą sztucznej inteligencji (AI). Użytkownicy mogą wklejać tekst źródłowy, na podstawie którego AI generuje zestaw fiszek (przód/tył). Wygenerowane fiszki można następnie przeglądać, edytować, akceptować lub odrzucać. Zaakceptowane fiszki są zapisywane na koncie użytkownika i mogą być wykorzystywane w zintegrowanym module nauki opartym na algorytmie powtórek rozłożonych w czasie (SRS - Spaced Repetition System). Aplikacja umożliwia również ręczne tworzenie fiszek oraz zarządzanie zapisaną kolekcją. Produkt skierowany jest do ogólnych użytkowników uczących się, bez specjalizacji w konkretnej dziedzinie.

## 2. Problem użytkownika

Tradycyjne metody tworzenia fiszek są czasochłonne i pracochłonne. Ręczne przepisywanie lub streszczanie materiałów źródłowych na zwięzłe pytania i odpowiedzi (przód/tył fiszki) może zniechęcać użytkowników do regularnego korzystania z tej wysoce efektywnej techniki nauki. Uczniowie i studenci potrzebują szybszego i bardziej efektywnego sposobu na przekształcanie swoich notatek, artykułów czy innych tekstów w gotowe do nauki fiszki.

## 3. Wymagania funkcjonalne

Aplikacja w wersji MVP (Minimum Viable Product) będzie składać się z trzech głównych modułów: Generowania, Nauki i Zarządzania, oraz podstawowych funkcji związanych z użytkownikiem i danymi.

### 3.1. Zarządzanie użytkownikami

- Rejestracja nowych użytkowników (wymaga zdefiniowania pól, np. email, hasło).
- Logowanie istniejących użytkowników.
- Powiązanie zapisanych fiszek z kontem zalogowanego użytkownika.

### 3.2. Moduł Generowania Fiszki

- Interfejs do wklejania tekstu źródłowego przez użytkownika (pole tekstowe).
- Walidacja długości wklejonego tekstu (limit 1000-10000 znaków).
- Przycisk "Generuj" inicjujący proces generowania fiszek przez AI.
- Wskaźnik wizualny (np. spinner) informujący o trwającym procesie generowania.
- Wyświetlanie listy wygenerowanych przez AI fiszek (docelowo 3-7, liczba określana przez AI). Każda fiszka zawiera widoczny Przód i Tył.
- Możliwość edycji inline treści Przodu i Tyłu każdej wygenerowanej fiszki przed jej zapisaniem.
- Przycisk "Zatwierdź" dla każdej fiszki: zapisuje fiszkę w bazie danych użytkownika i usuwa ją z widoku generowania.
- Przycisk "Odrzuć" dla każdej fiszki: usuwa fiszkę z widoku generowania bez zapisywania.
- Możliwość ręcznego dodania nowej, pustej fiszki w interfejsie generowania.
- Możliwość wypełnienia treści Przodu i Tyłu ręcznie dodanej fiszki i jej zapisania (traktowane jak zatwierdzenie).

### 3.3. Moduł Nauki

- Interfejs prezentujący użytkownikowi zapisane fiszki zgodnie z logiką wybranego algorytmu SRS (konkretny algorytm do wyboru, np. Leitner, uproszczony SM-2).
- Mechanizm interakcji użytkownika z algorytmem SRS (np. przyciski oceny znajomości fiszki: "Łatwe", "Trudne", "Powtórz").

### 3.4. Moduł Zarządzania

- Widok listy wszystkich zapisanych fiszek należących do zalogowanego użytkownika.
- Możliwość edycji treści Przodu i Tyłu zapisanych fiszek.
- Możliwość usuwania zapisanych fiszek.

### 3.5. Backend i Dane

- Integracja z zewnętrznym API modelu AI (np. ChatGPT) do generowania fiszek.
- Baza danych do przechowywania informacji o użytkownikach i ich fiszkach. Minimalny schemat fiszki: `userId`, `front` (treść przodu), `back` (treść tyłu), `createdAt` (data utworzenia), `source` (źródło: 'AI' lub 'manual'), oraz dodatkowe pola wymagane przez wybrany algorytm SRS (np. `nextReviewDate`, `interval`, `easeFactor`).
- Logowanie zdarzeń systemowych w celu śledzenia metryk sukcesu:
  - Utworzenie fiszki (`card_created`): z atrybutami `userId`, `source` ('AI'/'manual'), `timestamp`.
  - Ocena fiszki AI (`ai_card_reviewed`): z atrybutami `userId`, `decision` ('accepted'/'rejected'), `timestamp`.
- Podstawowa obsługa błędów (np. błąd komunikacji z API AI, błąd zapisu do bazy).

## 4. Granice produktu (Co NIE wchodzi w zakres MVP)

Następujące funkcje nie zostaną zaimplementowane w wersji MVP:

- Importowanie fiszek z plików (np. CSV, Anki).
- Importowanie tekstu źródłowego z formatów innych niż czysty tekst (np. PDF, DOCX).
- Współdzielenie fiszek lub talii między użytkownikami.
- Zaawansowane zarządzanie fiszkami: tworzenie talii, tagowanie, grupowanie.
- Zaawansowane opcje konfiguracji procesu generowania AI (np. wybór liczby fiszek, poziomu trudności, stylu).
- Integracja z zewnętrznymi platformami edukacyjnymi lub systemami LMS.
- Eksport fiszek do różnych formatów.
- Dedykowana aplikacja mobilna (produkt będzie aplikacją webową).
- Tryb offline.
- Szczegółowe statystyki nauki użytkownika (poza metrykami sukcesu MVP).
- Anonimowe logowanie zdarzeń.
- Zaawansowane funkcje edytora tekstu dla fiszek (np. formatowanie, obrazy).

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Autoryzacja

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc utworzyć konto w aplikacji, podając mój adres email i hasło, abym mógł zapisywać i zarządzać swoimi fiszkami.
- Kryteria akceptacji:

  - Formularz rejestracji zawiera pola na adres email i hasło (oraz potwierdzenie hasła).
  - System waliduje poprawność formatu adresu email.
  - System sprawdza, czy hasła w obu polach są identyczne.
  - System sprawdza, czy użytkownik o podanym adresie email już nie istnieje.
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji (np. modułu Generowania).
  - Hasło użytkownika jest przechowywane w bezpieczny sposób (np. hashowane).

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego adresu email i hasła, abym mógł uzyskać dostęp do moich zapisanych fiszek i funkcji aplikacji.
- Kryteria akceptacji:

  - Formularz logowania zawiera pola na adres email i hasło.
  - System weryfikuje poprawność podanych danych logowania.
  - W przypadku błędnych danych, wyświetlany jest odpowiedni komunikat.
  - Po pomyślnym zalogowaniu, użytkownik jest przekierowany do głównego widoku aplikacji.
  - System utrzymuje sesję użytkownika (np. za pomocą tokenów).

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zakończyć moją sesję.
- Kryteria akceptacji:
  - W interfejsie użytkownika dostępna jest opcja wylogowania (np. przycisk).
  - Kliknięcie opcji wylogowania kończy sesję użytkownika.
  - Użytkownik jest przekierowywany do strony logowania lub strony głównej dla niezalogowanych.

### 5.2. Moduł Generowania

- ID: US-101
- Tytuł: Wprowadzanie tekstu źródłowego
- Opis: Jako użytkownik, chcę móc wkleić tekst (od 1000 do 10000 znaków) do pola tekstowego w module Generowania, aby przygotować go do przetworzenia przez AI.
- Kryteria akceptacji:

  - W module Generowania znajduje się widoczne pole tekstowe (`textarea`).
  - Pole tekstowe akceptuje wklejony tekst.
  - System wyświetla informację o aktualnej liczbie znaków lub waliduje długość po próbie generowania.
  - Przycisk "Generuj" jest nieaktywny, jeśli liczba znaków jest poza dozwolonym zakresem (1000-10000).
  - Po wklejeniu tekstu w dozwolonym zakresie, przycisk "Generuj" staje się aktywny.

- ID: US-102
- Tytuł: Generowanie fiszek przez AI
- Opis: Jako użytkownik, po wklejeniu tekstu źródłowego, chcę móc kliknąć przycisk "Generuj", aby AI stworzyło dla mnie zestaw fiszek (3-7) na podstawie tego tekstu.
- Kryteria akceptacji:

  - Istnieje przycisk "Generuj".
  - Kliknięcie przycisku "Generuj" (gdy jest aktywny) wysyła tekst źródłowy do API AI.
  - Podczas przetwarzania przez AI, wyświetlany jest wskaźnik ładowania (np. spinner).
  - Po zakończeniu przetwarzania, wskaźnik ładowania znika.
  - System wyświetla listę wygenerowanych fiszek (3-7 par Przód/Tył).
  - W przypadku błędu komunikacji z AI, wyświetlany jest odpowiedni komunikat dla użytkownika.
  - Zdarzenie `card_created` z `source: AI` jest logowane dla każdej wygenerowanej fiszki (przed wyświetleniem użytkownikowi).

- ID: US-103
- Tytuł: Przeglądanie i edycja wygenerowanych fiszek
- Opis: Jako użytkownik, po wygenerowaniu fiszek przez AI, chcę móc przejrzeć każdą fiszkę (Przód i Tył) i edytować jej treść przed podjęciem decyzji o jej zatwierdzeniu lub odrzuceniu.
- Kryteria akceptacji:

  - Każda wygenerowana fiszka jest wyświetlana z widoczną treścią Przodu i Tyłu.
  - Treść Przodu i Tyłu każdej fiszki jest edytowalna (np. po kliknięciu, aktywuje się edycja inline).
  - Zmiany wprowadzone w trybie edycji są zapisywane w stanie tymczasowym fiszki (w frontendzie).

- ID: US-104
- Tytuł: Zatwierdzanie wygenerowanej fiszki
- Opis: Jako użytkownik, chcę móc zatwierdzić wygenerowaną (i ewentualnie edytowaną) fiszkę, aby zapisać ją w mojej kolekcji do późniejszej nauki.
- Kryteria akceptacji:

  - Każda wygenerowana fiszka ma przycisk "Zatwierdź".
  - Kliknięcie "Zatwierdź" powoduje zapisanie aktualnej treści fiszki (Przód/Tył) w bazie danych powiązanej z kontem użytkownika.
  - Pole `source` zapisanej fiszki jest ustawione na 'AI'.
  - Po pomyślnym zapisie, fiszka znika z listy wygenerowanych fiszek w module Generowania.
  - Zdarzenie `ai_card_reviewed` z `decision: accepted` jest logowane.
  - W przypadku błędu zapisu do bazy, wyświetlany jest odpowiedni komunikat, a fiszka pozostaje w widoku.

- ID: US-105
- Tytuł: Odrzucanie wygenerowanej fiszki
- Opis: Jako użytkownik, chcę móc odrzucić wygenerowaną fiszkę, jeśli uznam ją za nieprzydatną lub błędną, aby nie została ona zapisana w mojej kolekcji.
- Kryteria akceptacji:

  - Każda wygenerowana fiszka ma przycisk "Odrzuć".
  - Kliknięcie "Odrzuć" usuwa fiszkę z listy wygenerowanych fiszek w module Generowania.
  - Fiszka nie jest zapisywana w bazie danych.
  - Zdarzenie `ai_card_reviewed` z `decision: rejected` jest logowane.

- ID: US-106
- Tytuł: Ręczne tworzenie fiszki
- Opis: Jako użytkownik, chcę móc ręcznie dodać nową, pustą fiszkę i samodzielnie wypełnić jej Przód i Tył, aby stworzyć własną fiszkę od zera.
- Kryteria akceptacji:
  - W module Generowania dostępna jest opcja (np. przycisk "+ Dodaj fiszkę") do utworzenia nowej, pustej karty.
  - Po kliknięciu tej opcji, na liście pojawia się nowa fiszka z pustymi polami Przód i Tył, gotowymi do edycji.
  - Użytkownik może wypełnić pola Przód i Tył.
  - Dla ręcznie dodanej fiszki dostępny jest przycisk "Zapisz" (lub repurposed "Zatwierdź").
  - Kliknięcie "Zapisz" zapisuje fiszkę w bazie danych z `source: manual`.
  - Zdarzenie `card_created` z `source: manual` jest logowane.
  - Po zapisaniu, ręcznie dodana fiszka znika z widoku generowania.
  - Istnieje również opcja anulowania/usunięcia ręcznie dodawanej fiszki przed zapisem.

### 5.3. Moduł Nauki

- ID: US-201
- Tytuł: Rozpoczęcie sesji nauki
- Opis: Jako użytkownik, chcę móc przejść do modułu Nauki, aby rozpocząć sesję powtórek moich zapisanych fiszek zgodnie z algorytmem SRS.
- Kryteria akceptacji:

  - Istnieje nawigacja do modułu Nauki.
  - Po wejściu do modułu, system prezentuje pierwszą fiszkę do powtórki zgodnie z logiką algorytmu SRS (np. fiszkę z najwcześniejszą datą `nextReviewDate`).
  - Wyświetlany jest Przód fiszki.

- ID: US-202
- Tytuł: Odsłanianie odpowiedzi i ocena fiszki
- Opis: Jako użytkownik, podczas sesji nauki, chcę móc odsłonić Tył (odpowiedź) fiszki, a następnie ocenić, jak dobrze ją znam, aby algorytm SRS mógł zaplanować kolejną powtórkę.
- Kryteria akceptacji:
  - Po wyświetleniu Przodu fiszki, dostępna jest opcja (np. przycisk "Pokaż odpowiedź") do odsłonięcia Tyłu.
  - Po odsłonięciu Tyłu, dostępne są przyciski oceny (np. "Łatwe", "Trudne", "Powtórz" - zależne od wybranego SRS).
  - Kliknięcie przycisku oceny aktualizuje dane fiszki w bazie danych zgodnie z logiką algorytmu SRS (np. aktualizuje `nextReviewDate`, `interval`).
  - Po ocenie, system przechodzi do kolejnej fiszki zaplanowanej do powtórki lub kończy sesję, jeśli nie ma więcej fiszek na dany moment.

### 5.4. Moduł Zarządzania

- ID: US-301
- Tytuł: Przeglądanie zapisanych fiszek
- Opis: Jako użytkownik, chcę móc przejść do modułu Zarządzania, aby zobaczyć listę wszystkich moich zapisanych fiszek.
- Kryteria akceptacji:

  - Istnieje nawigacja do modułu Zarządzania.
  - Moduł Zarządzania wyświetla listę wszystkich fiszek zapisanych przez zalogowanego użytkownika.
  - Lista pokazuje co najmniej treść Przodu i Tyłu każdej fiszki.

- ID: US-302
- Tytuł: Edycja zapisanej fiszki
- Opis: Jako użytkownik, w module Zarządzania, chcę móc edytować treść Przodu i Tyłu moich zapisanych fiszek, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:

  - Na liście fiszek w module Zarządzania, każda fiszka ma opcję edycji (np. przycisk "Edytuj").
  - Aktywowanie edycji pozwala na modyfikację treści Przodu i Tyłu.
  - Istnieje opcja zapisania zmian wprowadzonych w fiszce.
  - Zapisanie zmian aktualizuje dane fiszki w bazie danych.

- ID: US-303
- Tytuł: Usuwanie zapisanej fiszki
- Opis: Jako użytkownik, w module Zarządzania, chcę móc trwale usunąć fiszkę, której już nie potrzebuję.
- Kryteria akceptacji:
  - Na liście fiszek w module Zarządzania, każda fiszka ma opcję usunięcia (np. przycisk "Usuń").
  - Przed usunięciem wyświetlane jest potwierdzenie (np. "Czy na pewno chcesz usunąć tę fiszkę?").
  - Po potwierdzeniu, fiszka jest trwale usuwana z bazy danych.
  - Fiszka znika z listy w module Zarządzania.

## 6. Metryki sukcesu

Kluczowe wskaźniki (KPI) dla oceny sukcesu wersji MVP:

1.  Funkcjonalność podstawowa: Użytkownicy mogą pomyślnie wykonać cały cykl życia fiszki:

    - Zalogować się/zarejestrować.
    - Wygenerować fiszki za pomocą AI z podanego tekstu.
    - Ręcznie utworzyć fiszkę.
    - Przejrzeć, edytować, zatwierdzić lub odrzucić wygenerowane fiszki.
    - Powtarzać zapisane fiszki w module Nauki.
    - Przeglądać, edytować i usuwać zapisane fiszki w module Zarządzania.
      (Mierzone poprzez testy funkcjonalne i podstawowe monitorowanie działania aplikacji).

2.  Dominacja generowania AI: Co najmniej 75% wszystkich fiszek utworzonych przez użytkowników w systemie pochodzi z generowania AI.
    (Mierzone przez analizę logów zdarzeń `card_created`, porównując liczbę fiszek z `source: AI` do `source: manual`).

3.  Akceptacja jakości AI: Co najmniej 75% fiszek wygenerowanych przez AI jest akceptowanych (zatwierdzanych) przez użytkowników.
    (Mierzone przez analizę logów zdarzeń `ai_card_reviewed`, obliczając stosunek liczby zdarzeń z `decision: accepted` do sumy zdarzeń `accepted` i `rejected`).
