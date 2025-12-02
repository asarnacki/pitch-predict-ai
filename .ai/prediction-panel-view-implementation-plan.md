# Plan implementacji widoku Panel Predykcji

## 1. Przegląd

Panel Predykcji to główny, publicznie dostępny widok aplikacji (`/`). Jego celem jest umożliwienie wszystkim użytkownikom (zarówno anonimowym, jak i zalogowanym) przeglądania nadchodzących meczów z trzech głównych lig europejskich, generowania dla nich predykcji AI oraz — w przypadku zalogowanych użytkowników — zapisywania tych predykcji na spersonalizowanej liście "Obserwowanych meczów". Widok ten jest kluczowym elementem interakcji i stanowi punkt wejścia do pozostałych funkcji aplikacji.

## 2. Routing widoku

Widok będzie dostępny pod główną ścieżką aplikacji: `/`.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane jako interaktywna wyspa Astro (Astro Island). Główny plik `src/pages/index.astro` będzie renderować komponent React `PredictionPanel.tsx`, który zarządza całą logiką i stanem widoku.

```
/ (index.astro)
└── PredictionPanel.tsx (client:load)
    ├── LeagueSelector.tsx
    ├── MatchList.tsx
    │   ├── SkeletonLoader[] (renderowany warunkowo podczas ładowania)
    │   ├── MatchCard.tsx (Accordion.Item)
    │   │   └── PredictionResult.tsx
    │   │       ├── Spinner (renderowany warunkowo)
    │   │       ├── BarChart.tsx
    │   │       └── SavePredictionForm.tsx (renderowany warunkowo dla zalogowanych)
    │   ├── MatchCard.tsx
    │   └── ...
    └── EmptyState.tsx (renderowany warunkowo, gdy brak meczów)
```

## 4. Szczegóły komponentów

### PredictionPanel (Główny komponent widoku)

- **Opis:** Główny kontener i "mózg" widoku. Zarządza stanem, w tym wybraną ligą, listą meczów, a także stanami ładowania i predykcji dla poszczególnych meczów. Komunikuje się z globalnym stanem autentykacji.
- **Główne elementy:** `div` zawierający `LeagueSelector` oraz `MatchList` lub `EmptyState`.
- **Obsługiwane interakcje:** Wybór ligi, rozwijanie kart meczów, zapisywanie predykcji (delegowane w dół).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PredictionPanelState`, `PredictionState`.
- **Propsy:** Brak.

### LeagueSelector

- **Opis:** Komponent `Tabs` (z Shadcn/ui) pozwalający na wybór jednej z trzech lig.
- **Główne elementy:** `Tabs`, `TabsList`, `TabsTrigger`.
- **Obsługiwane interakcje:** Wybór zakładki (`onValueChange`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `LEAGUE_CODES`.
- **Propsy:**
  - `selectedLeague: keyof typeof LEAGUE_CODES`: Aktualnie wybrana liga.
  - `onLeagueChange: (league: keyof typeof LEAGUE_CODES) => void`: Funkcja zwrotna wywoływana przy zmianie ligi.

### MatchList

- **Opis:** Lista meczów renderowana na podstawie danych z API. W stanie ładowania wyświetla serię komponentów `SkeletonLoader`.
- **Główne elementy:** `div` jako kontener. W stanie ładowania renderuje `Skeleton`. W stanie sukcesu mapuje listę meczów do komponentów `MatchCard` wewnątrz komponentu `Accordion` z Shadcn/ui.
- **Obsługiwane interakcje:** Rozwijanie/zwijanie `MatchCard` (obsługiwane przez `Accordion`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `MatchDTO[]`, `Record<string, PredictionState>`.
- **Propsy:**
  - `matches: MatchDTO[]`: Lista meczów do wyświetlenia.
  - `isLoading: boolean`: Informacja o stanie ładowania listy.
  - `predictionsState: Record<string, PredictionState>`: Stan predykcji dla wszystkich meczów.
  - `onGeneratePrediction: (match: MatchDTO) => void`: Funkcja zwrotna do wywołania generowania predykcji.
  - `onSavePrediction: (matchId: string, note: string | null) => void`: Funkcja zwrotna do zapisania predykcji.

### MatchCard

- **Opis:** Karta `Accordion.Item` reprezentująca pojedynczy mecz. Wyświetla podstawowe informacje (drużyny, data) w `AccordionTrigger`. W `AccordionContent` renderuje `PredictionResult`.
- **Główne elementy:** `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
- **Obsługiwane interakcje:** Kliknięcie w nagłówek w celu rozwinięcia/zwinięcia. Rozwinięcie karty po raz pierwszy inicjuje pobieranie predykcji.
- **Obsługiwana walidacja:** Pobieranie predykcji jest wywoływane tylko raz przy pierwszym otwarciu.
- **Typy:** `MatchDTO`, `PredictionState`.
- **Propsy:** Propsy przekazywane z `MatchList`.

### PredictionResult

- **Opis:** Komponent wyświetlający wynik predykcji. Obsługuje stan ładowania (`Spinner`), błędu (komunikat + przycisk "Spróbuj ponownie") i sukcesu (wyniki procentowe + `BarChart`). Dla zalogowanych użytkowników renderuje również `SavePredictionForm`.
- **Główne elementy:** `div`, `Spinner`, `BarChart`, `SavePredictionForm`.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Spróbuj ponownie".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PredictionState`.
- **Propsy:** Propsy dotyczące stanu konkretnej predykcji oraz funkcje zwrotne.

### SavePredictionForm

- **Opis:** Formularz widoczny tylko dla zalogowanych użytkowników, umożliwiający dodanie notatki i zapisanie predykcji.
- **Główne elementy:** `Textarea`, `Button`.
- **Obsługiwane interakcje:** Wpisywanie notatki, kliknięcie przycisku "Zapisz".
- **Obsługiwana walidacja:** Przycisk "Zapisz" jest nieaktywny, jeśli trwa zapisywanie lub predykcja została już zapisana. Długość notatki ograniczona do 500 znaków.
- **Typy:** `PredictionState['saveStatus']`.
- **Propsy:**
  - `matchId: string`: ID meczu, którego dotyczy formularz.
  - `saveStatus: PredictionState['saveStatus']`: Aktualny status operacji zapisu.
  - `onSave: (matchId: string, note: string | null) => void`: Funkcja zwrotna wywoływana po kliknięciu "Zapisz".

## 5. Typy

Oprócz typów DTO z `src/types.ts` (`MatchDTO`, `GeneratePredictionResponseDTO`, `CreatePredictionDTO`), widok będzie korzystał z wewnętrznych typów `ViewModel` do zarządzania stanem.

- **`PredictionPanelState`**:
  - `league: 'PL' | 'PD' | 'BL1'`: Aktualnie wybrana liga.
  - `matches: Record<'PL' | 'PD' | 'BL1', MatchDTO[]>`: Cache list meczów dla każdej ligi.
  - `matchesStatus: 'idle' | 'loading' | 'success' | 'error'`: Status ładowania listy meczów.
  - `predictions: Record<string, PredictionState>`: Słownik przechowujący stan predykcji dla każdego meczu, kluczem jest `match.id`.

- **`PredictionState`**:
  - `status: 'idle' | 'loading' | 'success' | 'error'`: Status generowania predykcji.
  - `data: GeneratePredictionResponseDTO | null`: Pobrane dane predykcji.
  - `saveStatus: 'idle' | 'saving' | 'saved' | 'error'`: Status zapisu predykcji.
  - `error: string | null`: Komunikat błędu.

## 6. Zarządzanie stanem

Logika zostanie zamknięta w customowym hooku `usePredictionPanel`, który będzie konsumował globalny kontekst autentykacji (`AuthContext`).

- **Hook `usePredictionPanel()`:**
  - **Cel:** Izolacja logiki od UI. Będzie zarządzał stanem `PredictionPanelState`.
  - **Funkcje:** Udostępni metody do zmiany ligi (`setLeague`), generowania predykcji po ID meczu (`generatePrediction`) oraz zapisywania predykcji (`savePrediction`).
  - **Logika:** Hook będzie sprawdzał stan zalogowania użytkownika z `AuthContext` i na tej podstawie decydował o możliwości zapisu predykcji. Będzie również zarządzał wywołaniem modala logowania, jeśli niezalogowany użytkownik spróbuje zapisać predykcję.

## 7. Integracja API

- **Pobieranie meczów:**
  - **Endpoint:** `GET /api/matches`
  - **Typ zapytania (Query):** `GetMatchesQueryParams`
  - **Typ odpowiedzi:** `ApiSuccessResponse<MatchesResponseDTO>`
- **Generowanie predykcji:**
  - **Endpoint:** `POST /api/predictions/generate`
  - **Typ zapytania (Body):** `GeneratePredictionRequestDTO`
  - **Typ odpowiedzi:** `ApiSuccessResponse<GeneratePredictionResponseDTO>`
- **Zapisywanie predykcji:**
  - **Endpoint:** `POST /api/predictions`
  - **Typ zapytania (Body):** `CreatePredictionDTO`
  - **Typ odpowiedzi:** `ApiSuccessResponse<PredictionDTO>`

## 8. Interakcje użytkownika

- **Wybór ligi:** Powoduje wywołanie `GET /api/matches` i aktualizację `MatchList`.
- **Rozwinięcie karty meczu:** Po raz pierwszy wywołuje `POST /api/predictions/generate`.
- **Kliknięcie "Zapisz" (niezalogowany):** Wywołuje globalną funkcję (z `AuthContext`) otwierającą modal logowania/rejestracji. Po pomyślnym zalogowaniu, predykcja powinna zostać automatycznie zapisana.
- **Kliknięcie "Zapisz" (zalogowany):** Wywołuje `POST /api/predictions`. Przycisk zmienia stan na "Zapisywanie...", a po sukcesie na "Zapisano" (i staje się nieaktywny).
- **Informacje zwrotne:** Każda asynchroniczna akcja (ładowanie, sukces, błąd) jest komunikowana przez `Skeleton`, `Spinner` lub `Toast`.

## 9. Warunki i walidacja

- **Formularz zapisu:** Komponent `SavePredictionForm` jest renderowany tylko wtedy, gdy `AuthContext` dostarcza informację o zalogowanym użytkowniku ORAZ gdy predykcja dla danego meczu została pomyślnie wygenerowana.
- **Długość notatki:** `Textarea` ma atrybut `maxLength="500"`.

## 10. Obsługa błędów

- **Błąd pobierania listy meczów:** Zamiast listy wyświetlany jest komponent `EmptyState` z komunikatem o błędzie i przyciskiem "Spróbuj ponownie".
- **Błąd generowania predykcji:** Wewnątrz rozwiniętej karty `MatchCard` wyświetlany jest komunikat o błędzie i przycisk "Spróbuj ponownie".
- **Błąd zapisu predykcji:** Wyświetlany jest `Toast` z błędem. Jeśli błąd to `403 Forbidden` (limit predykcji), treść komunikatu z API jest wyświetlana użytkownikowi.

## 11. Kroki implementacji

1.  Utworzenie pliku strony `src/pages/index.astro` i osadzenie w nim komponentu `PredictionPanel.tsx` jako wyspy (`client:load`).
2.  Stworzenie customowego hooka `usePredictionPanel.ts` do zarządzania stanem i logiką.
3.  Implementacja komponentu `PredictionPanel.tsx`, połączenie go z hookiem i globalnym `AuthContext`.
4.  Stworzenie komponentów `LeagueSelector.tsx` i `MatchList.tsx` (wraz z `SkeletonLoader`).
5.  Implementacja komponentu `MatchCard.tsx` jako elementu `Accordion`.
6.  Stworzenie komponentu `PredictionResult.tsx` obsługującego stany ładowania, błędu i sukcesu.
7.  Implementacja `SavePredictionForm.tsx`, który będzie warunkowo renderowany w `PredictionResult`.
8.  Połączenie akcji "Zapisz" dla niezalogowanych użytkowników z globalnym modalem autentykacji. Należy zaimplementować mechanizm "zapamiętywania" akcji do wykonania po zalogowaniu.
9.  Implementacja `BarChart.tsx` jako prostego komponentu wizualizacyjnego (np. używając `div` ze stylami `width`).
10. Dodanie obsługi powiadomień `Toast` dla operacji zapisu.
11. Dokładne ostylowanie wszystkich komponentów za pomocą Tailwind CSS i komponentów Shadcn/ui w celu zapewnienia spójności z resztą aplikacji.
12. Przeprowadzenie testów manualnych dla obu ścieżek użytkownika (zalogowanego i niezalogowanego).
