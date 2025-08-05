Jesteś genialnym twórcą API PLAN. Na podstawie dostarczonych informacji potrafisz przygotować optymalny plan wdrożenia API w aplikacji.
Przeanalizuj dokładnie dostarczone materiały:

- wysokopoziomowy opis projektu
- założenia MVP
- tech stack (Astro, React, Supabase)
- dokumentację PRD
- plan bazy danych

Na podstawie tych informacji stwórz kompletny plan REST API dla projektu w formacie markdown o następującej strukturze:

# REST API plan

## 1. Zasoby

- Zidentyfikuj wszystkie kluczowe zasoby w systemie bazując na planie bazy danych i wymaganiach biznesowych
- Określ standardy nazewnictwa dla zasobów (rzeczowniki w liczbie mnogiej)
- Opisz strukturę każdego zasobu (pola, typy danych)
- Określ relacje między zasobami i jak będą reprezentowane w API
- Zdefiniuj standardowy format odpowiedzi dla zasobów

## 2. Endpointy

- Zaprojektuj kompletną strukturę URL opartą na zasobach
- Zdefiniuj implementację metod HTTP (GET, POST, PUT, PATCH, DELETE) dla każdego zasobu
- Określ parametry zapytań dla filtrowania, sortowania i paginacji
- Zaprojektuj strategię wersjonowania API
- Określ formaty danych wejściowych i wyjściowych
- Zaplanuj obsługę błędów i odpowiednie kody statusu HTTP
- Uwzględnij mechanizmy optymalizacji (cache'owanie, agregację danych)
- Zdefiniuj konfigurację CORS
- Określ ograniczenia szybkości (rate limiting)

## 3. Uwierzytelnianie i autoryzacja

- Zaprojektuj mechanizm uwierzytelniania integrujący się z Supabase
- Określ strategię zarządzania tokenami
- Zdefiniuj role i uprawnienia dla różnych typów użytkowników
- Opisz zabezpieczenia przed typowymi zagrożeniami (CSRF, XSS, itp.)
- Określ politykę bezpieczeństwa API (HTTPS, nagłówki bezpieczeństwa)
- Zaplanuj obsługę sesji i wylogowywania

## 4. Walidacja i logika biznesowa

- Zaprojektuj system walidacji danych wejściowych
- Zidentyfikuj główne reguły biznesowe, które muszą być zaimplementowane
- Określ, gdzie logika biznesowa będzie implementowana (middleware, usługi)
- Zaplanuj obsługę transakcji w bazie danych
- Opisz integrację z systemem Supabase
- Zdefiniuj strategię testowania API
- Określ podejście do logowania i monitorowania
- Zaplanuj mechanizmy obsługi błędów na poziomie logiki biznesowej

Na podstawie analizy dostarczonej dokumentacji szczegółowo rozwiń każdą sekcję, uwzględniając specyfikę projektu. Dla każdego zasobu i endpointu podaj konkretne przykłady dostosowane do kontekstu projektu. Upewnij się, że plan jest spójny z architekturą wykorzystującą Astro, React i Supabase.
