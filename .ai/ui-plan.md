# Architektura UI dla PitchPredict AI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla PitchPredict AI została zaprojektowana z myślą o prostocie, intuicyjności i responsywności, aby sprostać potrzebom docelowych użytkowników — okazjonalnych kibiców piłki nożnej. Aplikacja opiera się na dwóch głównych widokach: **Panelu Predykcji**, który jest publicznie dostępny i stanowi serce aplikacji, oraz sekcji **"Obserwowane mecze"**, spersonalizowanego panelu dla zalogowanych użytkowników.

Struktura UI wykorzystuje nowoczesne wzorce, takie jak okna modalne do szybkiej autentykacji bez przerywania przepływu użytkownika, dynamiczne komponenty do interakcji (np. akordeon do wyświetlania predykcji) oraz jasny system informacji zwrotnej (powiadomienia typu Toast, stany ładowania Skeleton i Spinner). Architektura jest w pełni responsywna, dostosowując nawigację i układy do różnych rozmiarów ekranu. Kluczowe decyzje projektowe, takie jak obsługa trybu ciemnego, wyświetlanie logotypów drużyn i bezpośrednie prezentowanie wyników meczów, zostały włączone w celu poprawy doświadczenia użytkownika (UX). Globalny stan, w szczególności sesja użytkownika, jest zarządzany za pomocą React Context, co zapewnia spójność interfejsu w całej aplikacji.

## 2. Lista widoków

### Widok 1: Panel Predykcji (Strona Główna)

- **Nazwa widoku:** Panel Predykcji
- **Ścieżka widoku:** `/`
- **Główny cel:** Umożliwienie użytkownikom (zarówno anonimowym, jak i zalogowanym) przeglądania nadchodzących meczów z wybranych lig, generowania predykcji AI dla tych meczów oraz zapisywania ich do swojej listy obserwowanych.
- **Kluczowe informacje do wyświetlenia:**
  - Lista dostępnych lig (Premier League, La Liga, Bundesliga).
  - Lista nadchodzących meczów dla wybranej ligi (nazwy i loga drużyn, data meczu).
  - Wynik predykcji AI (procentowe szanse na wygraną gospodarzy, remis, wygraną gości).
  - Wizualizacja predykcji (np. wykres słupkowy).
  - Stan ładowania (dla listy meczów i generowania predykcji).
  - Komunikaty o błędach lub braku danych.
- **Kluczowe komponenty widoku:**
  - `Header`: Główny nagłówek z nawigacją.
  - `LeagueSelector`: Komponent `Tabs` (desktop) lub `Select` (mobile) do wyboru ligi.
  - `MatchList`: Lista kart z meczami (`MatchCard`).
  - `MatchCard`: Karta z informacjami o meczu, rozwijana w stylu `Accordion` po kliknięciu.
  - `PredictionGenerator`: Sekcja wewnątrz rozwiniętej karty, która obsługuje generowanie i wyświetlanie predykcji.
  - `SkeletonLoader`: Wskaźnik ładowania dla całej listy meczów.
  - `Spinner`: Wskaźnik ładowania dla pojedynczej predykcji.
  - `EmptyState`: Komponent wyświetlany, gdy dla danej ligi nie ma nadchodzących meczów.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Kliknięcie w mecz rozwija kartę, nie przenosząc użytkownika na inną stronę, co zapewnia płynność interakcji. Manualny przycisk "Odśwież" daje użytkownikowi kontrolę nad danymi. Przycisk "Zapisz" zmienia stan na "Zapisano", dając natychmiastową informację zwrotną.
  - **Dostępność:** Wyraźne stany `focus` dla zakładek, przycisków i kart. Elementy interaktywne posiadają odpowiednie atrybuty `aria-label`.
  - **Bezpieczeństwo:** Akcja zapisu predykcji jest dostępna tylko dla zalogowanych użytkowników, co jest weryfikowane po stronie klienta (ukrycie przycisku) i serwera (walidacja tokenu JWT).

### Widok 2: Obserwowane Mecze

- **Nazwa widoku:** Obserwowane Mecze
- **Ścieżka widoku:** `/watched` (dostęp chroniony)
- **Główny cel:** Zapewnienie zalogowanym użytkownikom dostępu do listy ich zapisanych predykcji, zarządzanie nimi (edycja notatek, usuwanie) oraz sprawdzanie oficjalnych wyników zakończonych meczów.
- **Kluczowe informacje do wyświetlenia:**
  - Lista zapisanych predykcji (dane meczu, zapisana predykcja, notatka użytkownika).
  - Oficjalny wynik zakończonego meczu.
  - Wizualne oznaczenie trafności predykcji.
  - Paginacja, jeśli lista jest długa.
  - Komunikat o pustej liście.
- **Kluczowe komponenty widoku:**
  - `Header`: Nagłówek z nawigacją.
  - `PredictionGrid`: Siatka kart z zapisanymi predykcjami.
  - `PredictionCard`: Karta z zapisaną predykcją, zawierająca opcje edycji notatki i usunięcia.
  - `FilterControls`: Opcje filtrowania (np. po lidze) i sortowania (np. po dacie).
  - `EditNoteModal`: Okno modalne do edycji notatki.
  - `ConfirmationDialog`: Okno modalne z prośbą o potwierdzenie usunięcia predykcji.
  - `EmptyState`: Komponent wyświetlany, gdy użytkownik nie ma żadnych zapisanych predykcji, z zachętą do działania (CTA).
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Filtry i sortowanie pozwalają na łatwe zarządzanie listą. Wyniki zakończonych meczów są wyświetlane bezpośrednio, bez potrzeby dodatkowej akcji. Edycja notatki w oknie modalnym zapobiega przeładowaniu strony.
  - **Dostępność:** Wszystkie elementy interaktywne (przyciski, filtry) mają etykiety i obsługują nawigację klawiaturą.
  - **Bezpieczeństwo:** Dostęp do widoku jest chroniony. Wszystkie operacje (CRUD) są autoryzowane na poziomie API, co uniemożliwia dostęp do danych innych użytkowników.

### Widok 3: Stany UI (nie są to oddzielne strony)

- **Nazwa widoku:** Modale Autentykacji
- **Ścieżka widoku:** Brak (nakładka na istniejący widok)
- **Główny cel:** Umożliwienie użytkownikom rejestracji i logowania bez opuszczania bieżącej strony.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz z polami na e-mail i hasło.
  - Link do odzyskiwania hasła.
  - Komunikaty o błędach walidacji (np. "Nieprawidłowy e-mail").
- **Kluczowe komponenty widoku:**
  - `Dialog`: Komponent okna modalnego.
  - `AuthForm`: Formularz z logiką walidacji.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Szybki i nieinwazyjny proces logowania/rejestracji. Po pomyślnej akcji modal jest zamykany, a UI (np. nagłówek) dynamicznie się aktualizuje.
  - **Dostępność:** Fokus jest zarządzany i przenoszony do okna modalnego. Możliwość zamknięcia za pomocą klawisza `Escape`.
  - **Bezpieczeństwo:** Hasła są przesyłane w bezpieczny sposób (HTTPS). Błędy autentykacji (np. "Błędne hasło") są ogólne, aby nie ujawniać informacji o istnieniu konta.

- **Nazwa widoku:** Strona Błędu 404
- **Ścieżka widoku:** Dowolna niezdefiniowana ścieżka
- **Główny cel:** Poinformowanie użytkownika, że strona, której szuka, nie istnieje.
- **Kluczowe komponenty widoku:** Dedykowany layout z komunikatem o błędzie i linkiem powrotnym na stronę główną.

## 3. Mapa podróży użytkownika

**Główny przypadek użycia: Odwiedzający staje się użytkownikiem i zapisuje pierwszą predykcję.**

1.  **Odkrywanie:** Użytkownik ląduje na **Panelu Predykcji** (`/`). Widzi domyślnie wybraną ligę i listę nadchodzących meczów.
2.  **Interakcja:** Użytkownik klika na interesujący go mecz na liście. Karta meczu płynnie rozwija się, pokazując wskaźnik `Spinner`.
3.  **Generowanie predykcji:** Po chwili `Spinner` znika, a na karcie pojawia się wygenerowana predykcja AI (procenty + wykres). Pod predykcją widoczny jest przycisk **"Zapisz do obserwowanych"**.
4.  **Inicjacja autentykacji:** Użytkownik klika "Zapisz". Ponieważ nie jest zalogowany, na ekranie pojawia się **Modal Logowania** z opcją przełączenia na rejestrację.
5.  **Rejestracja:** Użytkownik przechodzi do formularza rejestracji, wypełnia dane i zakłada konto.
6.  **Informacja zwrotna:** Modal zamyka się, a na ekranie pojawia się powiadomienie `Toast` z informacją "Rejestracja pomyślna!". Nagłówek strony (`Header`) dynamicznie się aktualizuje, pokazując link do **"Obserwowanych meczów"** i menu użytkownika.
7.  **Zapis predykcji:** Przycisk "Zapisz" jest teraz aktywny. Użytkownik klika go ponownie.
8.  **Potwierdzenie zapisu:** Pojawia się powiadomienie `Toast` ("Predykcja zapisana!"), a przycisk zmienia swój stan na nieaktywny z etykietą "Zapisano".
9.  **Przejście do listy:** Użytkownik klika w nowo pojawiły się link **"Obserwowane mecze"** w nagłówku.
10. **Weryfikacja:** Użytkownik jest przenoszony do widoku `/watched`, gdzie na liście widzi swoją właśnie zapisaną predykcję.

## 4. Układ i struktura nawigacji

Nawigacja jest scentralizowana w komponencie `Header`, który dynamicznie dostosowuje swoje elementy w zależności od stanu uwierzytelnienia użytkownika.

- **Struktura:**
  - **Nagłówek (`Header`):**
    - **Logo Aplikacji:** Zawsze widoczne, linkuje do strony głównej (`/`).
    - **Nawigacja główna:**
      - **Użytkownik niezalogowany:** Przyciski "Zaloguj" i "Zarejestruj".
      - **Użytkownik zalogowany:** Link do "Obserwowane mecze" (`/watched`).
    - **Menu dodatkowe:**
      - Przełącznik trybu Jasny/Ciemny.
      - **Użytkownik zalogowany:** Menu użytkownika (ikona/avatar) z opcją "Wyloguj".
- **Responsywność nawigacji:**
  - **Desktop:** Wszystkie linki nawigacyjne są widoczne w `Header`.
  - **Mobile:** Główne linki (np. "Obserwowane mecze") oraz opcje dodatkowe (wyloguj, przełącznik motywu) są schowane w menu typu "hamburger". Wybór ligi na stronie głównej zmienia się z `Tabs` na komponent `Select` wewnątrz menu.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które tworzą podstawę interfejsu użytkownika.

- **`Header`:** Globalny nagłówek aplikacji, dynamicznie renderujący nawigację w zależności od stanu zalogowania.
- **`ThemeToggle`:** Przełącznik do zmiany motywu (jasny/ciemny) w całej aplikacji.
- **`AuthModal`:** Modal zawierający formularze logowania i rejestracji, zintegrowany z walidacją i obsługą błędów.
- **`MatchCard`:** Karta reprezentująca pojedynczy mecz, z logiką rozwijania (`Accordion`) w celu wyświetlenia szczegółów predykcji.
- **`PredictionCard`:** Karta wyświetlająca zapisaną predykcję w widoku "Obserwowane mecze", zawierająca przyciski akcji (edytuj notatkę, usuń).
- **`Toast`:** Komponent do wyświetlania globalnych powiadomień (sukces, błąd, informacja).
- **`SkeletonLoader` / `Spinner`:** Komponenty do komunikowania stanów ładowania danych (dla list i pojedynczych akcji).
- **`EmptyState`:** Komponent wyświetlany w miejscach, gdzie brakuje danych (np. pusta lista meczów/predykcji), zawierający czytelny komunikat i opcjonalnie przycisk CTA.
- **`Dialog`:** Generyczny komponent okna modalnego, używany m.in. do potwierdzania operacji (np. usunięcia) i edycji notatek.
- **`Button`:** Główny, stylizowany komponent przycisku z wariantami i obsługą stanu nieaktywnego.
