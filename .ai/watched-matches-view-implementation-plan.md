# Plan implementacji widoku Obserwowane Mecze

## 1. Przegląd

Widok "Obserwowane Mecze" jest chronioną sekcją aplikacji dostępną tylko dla zalogowanych użytkowników. Jego głównym celem jest zapewnienie interfejsu do przeglądania, zarządzania i weryfikowania wyników wszystkich zapisanych predykcji meczów. Użytkownicy mogą filtrować i sortować swoją listę predykcji, edytować powiązane z nimi notatki, usuwać je oraz, po zakończeniu meczu, pobierać jego oficjalny wynik.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką: `/watched`. Dostęp do tej ścieżki powinien być zablokowany dla niezalogowanych użytkowników, którzy powinni być przekierowani do strony logowania lub głównej.

## 3. Struktura komponentów

Struktura zostanie zaimplementowana jako wyspa Astro (Astro Island), gdzie `WatchedMatchesPage.astro` będzie renderować główny komponent React `WatchedMatchesView`, odpowiedzialny za całą interaktywność.

```
/watched (WatchedMatchesPage.astro)
└── WatchedMatchesView.tsx (client:load)
    ├── FilterControls.tsx
    ├── PredictionGrid.tsx
    │   ├── PredictionCard.tsx
    │   ├── PredictionCard.tsx
    │   └── ...
    ├── PaginationControls.tsx
    ├── EditNoteModal.tsx (renderowany warunkowo)
    └── ConfirmationDialog.tsx (renderowany warunkowo)
```

## 4. Szczegóły komponentów

### WatchedMatchesView (Główny komponent widoku)

- **Opis:** Komponent-kontener, który zarządza stanem całego widoku. Odpowiada za pobieranie danych, obsługę akcji użytkownika (filtrowanie, paginacja) i renderowanie komponentów podrzędnych.
- **Główne elementy:** `div` jako wrapper, który renderuje `FilterControls`, `PredictionGrid`, `PaginationControls` oraz modale.
- **Obsługiwane interakcje:** Zmiana filtrów, sortowania, paginacji. Otwieranie modali do edycji i usuwania.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `WatchedMatchesState`, `ModalState`.
- **Propsy:** Brak.

### FilterControls

- **Opis:** Pasek narzędzi z kontrolkami (np. `Select` z Shadcn/ui) pozwalającymi użytkownikowi na filtrowanie predykcji (np. po lidze) i zmianę porządku sortowania (np. po dacie meczu).
- **Główne elementy:** Komponenty `Select` i `Label` z Shadcn/ui.
- **Obsługiwane interakcje:** `onChange` na selectach.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `GetPredictionsQueryParams`.
- **Propsy:**
  - `queryParams: GetPredictionsQueryParams`: Aktualne parametry filtrowania i sortowania.
  - `onParamsChange: (params: Partial<GetPredictionsQueryParams>) => void`: Funkcja zwrotna wywoływana przy zmianie wartości kontrolek.

### PredictionGrid

- **Opis:** Siatka wyświetlająca listę zapisanych predykcji. Renderuje komponent `PredictionCard` dla każdej predykcji. Obsługuje również stany ładowania (wyświetlając `SkeletonLoader`) oraz pusty stan (wyświetlając `EmptyState`), gdy użytkownik nie ma żadnych zapisanych predykcji.
- **Główne elementy:** `div` z grid layoutem, mapowanie po liście predykcji i renderowanie `PredictionCard`.
- **Obsługiwane interakcje:** Brak (przekazuje zdarzenia z `PredictionCard` w górę).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PredictionDTO[]`.
- **Propsy:**
  - `predictions: PredictionDTO[]`: Lista predykcji do wyświetlenia.
  - `isLoading: boolean`: Informacja o stanie ładowania.
  - `onEdit: (prediction: PredictionDTO) => void`: Funkcja zwrotna do otwarcia modala edycji.
  - `onDelete: (prediction: PredictionDTO) => void`: Funkcja zwrotna do otwarcia modala usuwania.
  - `onFetchResult: (predictionId: number) => void`: Funkcja zwrotna do pobrania wyniku meczu.

### PredictionCard

- **Opis:** Karta (komponent `Card` z Shadcn/ui) wyświetlająca szczegóły pojedynczej predykcji: drużyny, datę meczu, wynik predykcji, notatkę oraz przyciski akcji.
- **Główne elementy:** Komponenty `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Button` z Shadcn/ui.
- **Obsługiwane interakcje:** Kliknięcie przycisków "Edytuj notatkę", "Usuń", "Sprawdź wynik".
- **Obsługiwana walidacja:** Przycisk "Sprawdź wynik" jest widoczny i aktywny tylko wtedy, gdy data meczu jest w przeszłości, a wynik nie został jeszcze pobrany (`home_score` jest `null`).
- **Typy:** `PredictionDTO`.
- **Propsy:**
  - `prediction: PredictionDTO`: Dane predykcji do wyświetlenia.
  - `onEdit: (prediction: PredictionDTO) => void`: Funkcja zwrotna wywoływana po kliknięciu "Edytuj".
  - `onDelete: (prediction: PredictionDTO) => void`: Funkcja zwrotna wywoływana po kliknięciu "Usuń".
  - `onFetchResult: (predictionId: number) => void`: Funkcja zwrotna wywoływana po kliknięciu "Sprawdź wynik".

### EditNoteModal

- **Opis:** Okno modalne (komponent `Dialog` z Shadcn/ui) zawierające formularz z polem `Textarea` do edycji notatki przypisanej do predykcji.
- **Główne elementy:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Textarea`, `Button`.
- **Obsługiwane interakcje:** Wpisywanie tekstu, kliknięcie przycisku "Zapisz" lub "Anuluj".
- **Obsługiwana walidacja:** Walidacja długości notatki po stronie klienta (max 500 znaków, zgodnie z `BUSINESS_RULES.MAX_NOTE_LENGTH`), uniemożliwiająca zapis, jeśli warunek nie jest spełniony.
- **Typy:** `PredictionDTO`.
- **Propsy:**
  - `isOpen: boolean`: Stan otwarcia modala.
  - `prediction: PredictionDTO | null`: Dane predykcji do edycji.
  - `onSave: (predictionId: number, note: string) => void`: Funkcja zwrotna przy zapisie.
  - `onClose: () => void`: Funkcja zwrotna przy zamknięciu modala.

### ConfirmationDialog

- **Opis:** Proste okno modalne (komponent `AlertDialog` z Shadcn/ui) z prośbą o potwierdzenie operacji usunięcia predykcji.
- **Główne elementy:** `AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Potwierdź" lub "Anuluj".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PredictionDTO`.
- **Propsy:**
  - `isOpen: boolean`: Stan otwarcia modala.
  - `prediction: PredictionDTO | null`: Dane predykcji do usunięcia.
  - `onConfirm: (predictionId: number) => void`: Funkcja zwrotna po potwierdzeniu.
  - `onCancel: () => void`: Funkcja zwrotna po anulowaniu.

## 5. Typy

Wykorzystane zostaną istniejące typy DTO z `src/types.ts`. Dodatkowo, na potrzeby zarządzania stanem widoku, zdefiniowane zostaną następujące typy `ViewModel`.

- **`WatchedMatchesState`**: Główny obiekt stanu dla widoku.
  - `predictions: PredictionDTO[]`: Lista aktualnie wyświetlanych predykcji.
  - `pagination: PaginationMetadata | null`: Metadane paginacji z API.
  - `queryParams: GetPredictionsQueryParams`: Aktualny stan filtrów, sortowania i paginacji.
  - `status: 'idle' | 'loading' | 'success' | 'error'`: Status pobierania danych.
  - `error: string | null`: Komunikat błędu.
  - `modalState: ModalState`: Stan zarządzania aktywnymi oknami modalnymi.

- **`ModalState`**: Obiekt definiujący, który modal jest aktualnie otwarty i jakie dane przechowuje.
  - `type: 'edit-note' | 'delete-confirm' | null`: Typ aktywnego modala.
  - `data: PredictionDTO | null`: Dane predykcji przekazane do modala.

## 6. Zarządzanie stanem

Cała logika biznesowa, zarządzanie stanem i interakcje z API zostaną zamknięte w customowym hooku `useWatchedMatches`.

- **Hook `useWatchedMatches()`:**
  - **Cel:** Abstrakcja logiki od komponentu. Hook będzie odpowiedzialny za:
    - Przechowywanie stanu `WatchedMatchesState`.
    - Pobieranie danych z `GET /api/predictions` na podstawie `queryParams`.
    - Udostępnianie funkcji do modyfikacji stanu (edycja, usuwanie, pobieranie wyniku).
    - Zarządzanie stanem `loading` i `error`.
    - Zarządzanie stanem modali.
  - **Zwracane wartości:** Obiekt zawierający aktualny stan (`state`) oraz funkcje do interakcji (`setQueryParams`, `updateNote`, `deletePrediction`, `fetchResult`, `openModal`, `closeModal`).

## 7. Integracja API

Komponenty będą komunikować się z API za pośrednictwem funkcji udostępnionych przez hook `useWatchedMatches`.

- **Pobieranie listy predykcji:**
  - **Endpoint:** `GET /api/predictions`
  - **Typ zapytania (Query Params):** `GetPredictionsQueryParams`
  - **Typ odpowiedzi:** `ApiSuccessResponse<PaginatedPredictionsResponseDTO>`
- **Aktualizacja notatki:**
  - **Endpoint:** `PATCH /api/predictions/:id`
  - **Typ zapytania (Body):** `UpdatePredictionDTO`
  - **Typ odpowiedzi:** `ApiSuccessResponse<PredictionDTO>`
- **Usuwanie predykcji:**
  - **Endpoint:** `DELETE /api/predictions/:id`
  - **Typ odpowiedzi:** `204 No Content`
- **Pobieranie wyniku meczu:**
  - **Endpoint:** `POST /api/predictions/:id/fetch-result`
  - **Typ odpowiedzi:** `ApiSuccessResponse<PredictionDTO>`

## 8. Interakcje użytkownika

- **Filtrowanie/Sortowanie:** Zmiana wartości w `FilterControls` wywołuje `setQueryParams` w hooku, co powoduje zresetowanie paginacji (`offset: 0`) i ponowne pobranie danych z API.
- **Edycja notatki:** Kliknięcie "Edytuj" na karcie otwiera `EditNoteModal`. Zapisanie notatki wywołuje funkcję `updateNote`, która wysyła żądanie `PATCH`, a po sukcesie aktualizuje stan lokalny i zamyka modal.
- **Usuwanie predykcji:** Kliknięcie "Usuń" otwiera `ConfirmationDialog`. Potwierdzenie wywołuje `deletePrediction`, która wysyła żądanie `DELETE`, a po sukcesie usuwa element ze stanu lokalnego.
- **Sprawdzanie wyniku:** Kliknięcie "Sprawdź wynik" wywołuje `fetchResult`, która wysyła żądanie `POST`. Karta na czas operacji pokazuje wskaźnik ładowania. Po sukcesie, stan karty jest aktualizowany o wynik meczu.

## 9. Warunki i walidacja

- **Długość notatki:** Pole `Textarea` w `EditNoteModal` będzie miało walidację `maxLength="500"`. Przycisk zapisu będzie nieaktywny, jeśli notatka przekroczy tę długość.
- **Dostępność akcji "Sprawdź wynik":** Przycisk w `PredictionCard` będzie renderowany warunkowo: `if (new Date(prediction.match_date) < new Date() && prediction.home_score === null)`.

## 10. Obsługa błędów

- **Błąd pobierania listy:** Widok wyświetli ogólny komunikat o błędzie zamiast siatki predykcji.
- **Błąd zapisu/usunięcia/pobrania wyniku:** Odpowiedni modal lub karta wyświetli błąd (np. za pomocą komponentu `Toast` z Shadcn/ui) informujący o niepowodzeniu operacji. Błędy będą logowane w konsoli, aby ułatwić debugowanie. W przypadku błędu walidacji (np. `409 Conflict` przy próbie pobrania wyniku niezakończonego meczu), zostanie wyświetlony komunikat błędu zwrócony przez API.

## 11. Kroki implementacji

1.  Utworzenie pliku strony `src/pages/watched.astro`. Zabezpieczenie go po stronie serwera, aby wymagał zalogowanego użytkownika.
2.  W pliku `watched.astro` wyrenderowanie głównego komponentu React `WatchedMatchesView.tsx` z dyrektywą `client:load`.
3.  Stworzenie customowego hooka `useWatchedMatches.ts`, który będzie zawierał całą logikę stanu i komunikacji z API.
4.  Implementacja szkieletów komponentów: `WatchedMatchesView`, `FilterControls`, `PredictionGrid`, `PredictionCard`, `EditNoteModal`, `ConfirmationDialog`.
5.  Implementacja `WatchedMatchesView`: połączenie z hookiem `useWatchedMatches`, przekazanie stanu i funkcji do komponentów podrzędnych.
6.  Implementacja `FilterControls`: podłączenie do propów `queryParams` i `onParamsChange`.
7.  Implementacja `PredictionGrid` i `PredictionCard`: wyświetlanie danych predykcji, obsługa stanów ładowania i pustego, podłączenie przycisków akcji do propów.
8.  Implementacja `EditNoteModal` i `ConfirmationDialog`: zarządzanie ich stanem (widocznością) z poziomu `WatchedMatchesView`, obsługa logiki zapisu/potwierdzenia.
9.  Dodanie obsługi paginacji (`PaginationControls`), która będzie modyfikować `offset` w `queryParams`.
10. Stylowanie wszystkich komponentów za pomocą Tailwind CSS i komponentów Shadcn/ui.
11. Finalne testy interakcji, obsługi błędów i przypadków brzegowych (np. pusta lista, błędy API).
