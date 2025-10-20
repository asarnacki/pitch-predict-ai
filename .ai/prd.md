# Dokument wymagań produktu (PRD) - PitchPredict AI
## 1. Przegląd produktu
PitchPredict AI to aplikacja webowa w wersji MVP (Minimum Viable Product) zaprojektowana dla okazjonalnych kibiców piłki nożnej. Aplikacja wykorzystuje modele AI dostępne przez API do generowania procentowych predykcji wyników meczów (wygrana gospodarzy, remis, wygrana gości) dla trzech czołowych lig europejskich: Premier League, La Liga i Bundesligi. Użytkownicy mogą założyć konto, generować predykcje i zapisywać je na spersonalizowanej liście "Obserwowanych meczów", aby móc do nich wrócić w przyszłości.

Produkt stawia na prostotę i dostarczanie jednej, kluczowej wartości: obiektywnej, opartej na danych sugestii dotyczącej wyniku meczu, przedstawionej w czytelny sposób.

## 2. Problem użytkownika
Kibice piłki nożnej i osoby zainteresowane sportem często chcą ocenić prawdopodobieństwo wyniku nadchodzącego meczu. Obecnie muszą polegać na własnej intuicji, fragmentarycznych statystykach rozproszonych po wielu portalach internetowych lub płatnych, skomplikowanych serwisach analitycznych. Brakuje prostego, darmowego narzędzia, które w jednym miejscu agreguje kluczowe dane i przedstawia szybką, zrozumiałą predykcję wygenerowaną przez model AI.

PitchPredict AI ma rozwiązać ten problem, dostarczając łatwo dostępne i czytelne prognozy, które mogą stanowić ciekawy punkt odniesienia i wzbogacić doświadczenie kibicowania.

## 3. Wymagania funkcjonalne
### 3.1. System Autentykacji
-   FR-001: Użytkownik może zarejestrować nowe konto przy użyciu adresu e-mail i hasła.
-   FR-002: Użytkownik może zalogować się na istniejące konto.
-   FR-003: Użytkownik może się wylogować z aplikacji.
-   FR-004: Użytkownik, który zapomniał hasła, może zainicjować proces jego resetowania poprzez e-mail.

### 3.2. Panel Predykcji
-   FR-005: Interfejs główny wyświetla zakładki (tabs) do wyboru ligi: Premier League, La Liga, Bundesliga.
-   FR-006: Po wybraniu ligi, aplikacja wyświetla listę nadchodzących meczów pobraną z API `football-data.org`.
-   FR-007: Użytkownik może wybrać jeden mecz z listy, aby wygenerować predykcję.
-   FR-008: Aplikacja wysyła zapytanie do API `Openrouter.ai` z danymi wejściowymi (forma, bilans bramkowy, pozycja w tabeli, status gospodarz/gość).
-   FR-009: Wynik predykcji jest wyświetlany w formie trzech wartości procentowych (Wygrana Gospodarzy | Remis | Wygrana Gości) wraz z prostą wizualizacją (wykres słupkowy).
-   FR-010: Interfejs informuje użytkownika o stanie ładowania (spinner) oraz o ewentualnych błędach podczas generowania predykcji.

### 3.3. Historia Predykcji ("Obserwowane mecze")
-   FR-011: Zalogowany użytkownik może zapisać wygenerowaną predykcję na swojej liście.
-   FR-012: Podczas zapisywania predykcji użytkownik może dodać opcjonalną notatkę tekstową.
-   FR-013: Użytkownik ma dostęp do osobnej sekcji z listą wszystkich swoich zapisanych predykcji, posortowanych chronologicznie.
-   FR-014: Użytkownik może edytować notatkę przypisaną do zapisanej predykcji.
-   FR-015: Użytkownik może usunąć wybraną predykcję ze swojej listy.
-   FR-016: Po zakończeniu meczu, użytkownik może sprawdzić jego wynik na liście (wynik pobierany "na żądanie" z API).
-   FR-017: Liczba zapisanych predykcji na jednego użytkownika jest ograniczona do 50.

### 3.4. Aspekty Techniczne
-   FR-018: Aplikacja implementuje mechanizm cache'owania zapytań do `Openrouter.ai` i `football-data.org` w celu optymalizacji kosztów i wydajności.

## 4. Granice produktu
Następujące funkcjonalności są celowo wykluczone z zakresu MVP:
-   Systemy płatności i subskrypcji.
-   Zaawansowane analizy statystyczne (np. wykresy formy, historia bezpośrednich spotkań).
-   Predykcje na żywo, w trakcie trwania meczu.
-   System powiadomień (e-mail, push).
-   Funkcje społecznościowe (komentarze, rankingi, udostępnianie).
-   Integracja z kursami bukmacherskimi.
-   Dedykowana aplikacja mobilna (aplikacja webowa będzie responsywna).
-   Wsparcie dla wielu języków (tylko język polski).
-   Automatyczna aktualizacja wyników w tle.
-   Grupowanie predykcji w "kupony" lub "zestawy".

## 5. Historyjki użytkowników
### 5.1. Autentykacja
-   ID: US-001
-   Tytuł: Rejestracja nowego użytkownika
-   Opis: Jako nowy gość, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby uzyskać dostęp do funkcji zapisywania predykcji.
-   Kryteria akceptacji:
    -   Formularz rejestracji zawiera pola na e-mail i hasło.
    -   System waliduje poprawność formatu adresu e-mail.
    -   System wymaga hasła o minimalnej długości.
    -   Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego panelu.
    -   W przypadku błędu (np. zajęty e-mail) widzę stosowny komunikat.

-   ID: US-002
-   Tytuł: Logowanie użytkownika
-   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do mojej listy obserwowanych meczów.
-   Kryteria akceptacji:
    -   Formularz logowania zawiera pola na e-mail i hasło.
    -   Po poprawnym zalogowaniu jestem przekierowany do głównego panelu.
    -   W przypadku podania błędnych danych widzę stosowny komunikat.

-   ID: US-003
-   Tytuł: Odzyskiwanie hasła
-   Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę mieć możliwość zresetowania go, aby odzyskać dostęp do konta.
-   Kryteria akceptacji:
    -   Na stronie logowania znajduje się link "Zapomniałem hasła".
    -   Po kliknięciu i podaniu adresu e-mail, otrzymuję na skrzynkę wiadomość z linkiem do resetu hasła.
    -   Link jest unikalny i ma ograniczony czas ważności.
    -   Po przejściu na stronę z linku mogę ustawić nowe hasło.

### 5.2. Generowanie Predykcji
-   ID: US-004
-   Tytuł: Przeglądanie meczów
-   Opis: Jako użytkownik, chcę móc łatwo przełączać się między dostępnymi ligami, aby zobaczyć listę nadchodzących meczów.
-   Kryteria akceptacji:
    -   Na stronie głównej widoczne są trzy zakładki: "Premier League", "La Liga", "Bundesliga".
    -   Kliknięcie w zakładkę powoduje wyświetlenie listy meczów tylko dla tej ligi.
    -   Lista jest posortowana od meczu, który odbędzie się najwcześniej.

-   ID: US-005
-   Tytuł: Generowanie predykcji dla meczu
-   Opis: Jako użytkownik, chcę po wybraniu meczu zobaczyć jego predykcję w formie procentowej, aby szybko ocenić szanse drużyn.
-   Kryteria akceptacji:
    -   Po kliknięciu na mecz widzę wskaźnik ładowania.
    -   Po chwili wskaźnik znika i pojawia się wynik: X% - Wygrana Gospodarzy, Y% - Remis, Z% - Wygrana Gości.
    -   Suma procentów wynosi 100%.
    -   Predykcji towarzyszy prosta wizualizacja (wykres słupkowy).
    -   W przypadku błędu API widzę komunikat o niepowodzeniu i przycisk "Spróbuj ponownie".

### 5.3. Zarządzanie "Obserwowanymi meczami"
-   ID: US-006
-   Tytuł: Zapisywanie predykcji
-   Opis: Jako zalogowany użytkownik, chcę móc zapisać wygenerowaną predykcję na mojej liście, aby do niej wrócić później.
-   Kryteria akceptacji:
    -   Pod wygenerowaną predykcją znajduje się przycisk "Zapisz do obserwowanych".
    -   Obok przycisku jest pole do wpisania opcjonalnej notatki.
    -   Po kliknięciu przycisku predykcja wraz z notatką pojawia się na mojej liście w sekcji "Obserwowane mecze".
    -   Jeśli limit 50 predykcji jest osiągnięty, widzę komunikat o niemożności zapisania kolejnej.

-   ID: US-007
-   Tytuł: Przeglądanie zapisanych predykcji
-   Opis: Jako zalogowany użytkownik, chcę mieć dostęp do listy wszystkich moich zapisanych predykcji, aby móc je przeglądać.
-   Kryteria akceptacji:
    -   W nawigacji aplikacji znajduje się link do "Obserwowanych meczów".
    -   Lista zawiera wszystkie moje zapisane predykcje, posortowane chronologicznie.
    -   Każdy element listy pokazuje drużyny, datę meczu, zapisaną predykcję i moją notatkę.

-   ID: US-008
-   Tytuł: Edycja notatki do predykcji
-   Opis: Jako zalogowany użytkownik, chcę móc edytować notatkę do zapisanej predykcji, aby zaktualizować swoje przemyślenia.
-   Kryteria akceptacji:
    -   Na liście obserwowanych, przy każdej predykcji, znajduje się opcja "Edytuj notatkę".
    -   Po jej kliknięciu mogę zmienić treść notatki i zapisać zmiany.

-   ID: US-009
-   Tytuł: Usuwanie predykcji
-   Opis: Jako zalogowany użytkownik, chcę móc usunąć predykcję z mojej listy, jeśli już mnie nie interesuje.
-   Kryteria akceptacji:
    -   Przy każdej predykcji znajduje się opcja "Usuń".
    -   Przed usunięciem widzę prośbę o potwierdzenie operacji.
    -   Po potwierdzeniu predykcja znika z mojej listy.

-   ID: US-010
-   Tytuł: Weryfikacja wyniku
-   Opis: Jako zalogowany użytkownik, chcę po zakończeniu meczu móc sprawdzić jego oficjalny wynik na liście moich predykcji.
-   Kryteria akceptacji:
    -   Jeśli mecz na liście już się zakończył, mogę kliknąć przycisk "Sprawdź wynik".
    -   Po kliknięciu aplikacja odpytuje API i wyświetla obok mojej predykcji oficjalny wynik meczu.
    -   Jeśli wynik nie jest jeszcze dostępny, widzę odpowiedni komunikat.

## 6. Metryki sukcesu
### 6.1. Metryki Techniczne
-   Stabilność Autentykacji: Dążenie do 100% pomyślnych operacji logowania i rejestracji.
-   Dostępność Predykcji: Pomyślne wygenerowanie predykcji dla >95% zapytań użytkowników.
-   Czas odpowiedzi API: Średni czas generowania predykcji poniżej 3 sekund.

### 6.2. Metryki Biznesowe/Użytkowe
-   Czytelność Wyników: W testach z użytkownikami 5 na 5 badanych rozumie prezentację wyniku bez dodatkowych wyjaśnień.
-   Użyteczność CRUD: Użytkownik jest w stanie zapisać, znaleźć i usunąć predykcję w maksymalnie 4 kliknięciach.
-   Wartość dla Użytkownika: W ankiecie po testach, co najmniej 3 z 5 użytkowników określa aplikację jako "przydatną" lub "interesującą".
-   Zaangażowanie (KPI po wdrożeniu): Średnia liczba zapisanych predykcji na aktywnego użytkownika tygodniowo wynosi > 2.
