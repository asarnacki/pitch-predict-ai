# Plan Testów dla PitchPredict AI

## 1. Wprowadzenie i Cele
Celem niniejszego planu jest zapewnienie wysokiej jakości aplikacji PitchPredict AI (MVP) poprzez weryfikację zgodności z wymaganiami biznesowymi (PRD) oraz technicznymi. Głównym celem jest zagwarantowanie stabilności kluczowych funkcjonalności: autentykacji, pobierania danych meczowych oraz generowania predykcji AI, przy jednoczesnym zachowaniu bezpieczeństwa danych użytkowników.

## 2. Zakres Testów
*   **W zakresie (In-Scope):**
    *   REST API endpoints (`src/pages/api/*`).
    *   Logika biznesowa i serwisy (`src/lib/services/*`).
    *   Interfejs użytkownika (Komponenty React i strony Astro).
    *   Integracja z Supabase (Auth + DB + RLS).
    *   Mockowana integracja z zewnętrznymi API (OpenRouter, football-data.org).
    *   Mechanizmy cache'owania.
*   **Poza zakresem (Out-of-Scope):**
    *   Testy wydajnościowe (load testing) zewnętrznych API (OpenRouter, football-data.org).
    *   Testy penetracyjne infrastruktury DigitalOcean (skupiamy się na aplikacji).

## 3. Strategia i Typy Testów

### A. Testy Jednostkowe (Unit Tests)
Fokus na izolowanej logice biznesowej i walidacji.
*   **Cel:** Szybka weryfikacja logiki bez zapytań do sieci/bazy.
*   **Obszar:**
    *   `src/lib/validation/schemas.ts`: Testowanie reguł Zod (poprawne/błędne dane).
    *   `src/lib/services/cache.service.ts`: Testowanie TTL i mechanizmu wygasania.
    *   `src/lib/errors/formatter.ts`: Sprawdzanie formatowania błędów.
    *   Utilsy i helpery.

### B. Testy Integracyjne (Integration Tests)
Fokus na współpracy komponentów z bazą danych i zewnętrznymi serwisami (mockowanymi).
*   **Cel:** Weryfikacja przepływu danych między serwisami a API.
*   **Obszar:**
    *   API Endpoints: Testowanie requestów/response (statusy 200, 400, 401, 403, 500).
    *   **Database & RLS:** Krytyczne testy sprawdzające, czy zapytania do Supabase respektują polityki bezpieczeństwa (np. próba pobrania predykcji innego użytkownika).
    *   Service integration: Testowanie `prediction.service.ts` z zamockowanym `supabase.client`.

### C. Testy Komponentów (Component Tests)
*   **Cel:** Weryfikacja interakcji UI i stanów.
*   **Obszar:**
    *   `AuthForm`: Walidacja formularza, obsługa błędów logowania, stany loading.
    *   `PredictionPanel`: Wyświetlanie danych, obsługa przycisków generowania.
    *   `MatchList`: Poprawne renderowanie listy meczów i stanów pustych/ładowania.

### D. Testy End-to-End (E2E)
*   **Cel:** Weryfikacja krytycznych ścieżek użytkownika (Happy Path).
*   **Uwaga:** Ze względu na koszty AI, w środowisku CI/CD testy te powinny używać **mocków** dla endpointów `/api/predictions/generate`.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### Moduł Autentykacji (Auth)
| ID | Scenariusz | Oczekiwany Rezultat | Priorytet |
|----|------------|---------------------|-----------|
| AUTH-01 | Rejestracja nowego użytkownika (prawidłowe dane) | Utworzenie konta, przekierowanie, email weryfikacyjny (mock) | Wysoki |
| AUTH-02 | Logowanie z błędnym hasłem | Błąd 401, komunikat "Invalid credentials" | Wysoki |
| AUTH-03 | Dostęp do protected route (`/predictions`) bez sesji | Przekierowanie na `/login` (Middleware check) | Wysoki |
| AUTH-04 | Reset hasła | Wysłanie linku resetującego (Supabase flow) | Średni |

### Moduł Meczów i Danych (Football Data)
| ID | Scenariusz | Oczekiwany Rezultat | Priorytet |
|----|------------|---------------------|-----------|
| DATA-01 | Pobranie listy meczów (PL, PD, BL1) | Status 200, lista obiektów zgodna z `MatchDTO` | Wysoki |
| DATA-02 | Cache'owanie zapytań o mecze | Drugie zapytanie w ciągu 1h nie uderza do zew. API | Średni |
| DATA-03 | Obsługa błędu zewnętrznego API (np. limit) | Wyświetlenie przyjaznego komunikatu (nie 500) | Średni |

### Moduł Predykcji (AI Core)
| ID | Scenariusz | Oczekiwany Rezultat | Priorytet |
|----|------------|---------------------|-----------|
| PRED-01 | Generowanie predykcji (AI Success) | Otrzymanie JSON z polami `home`, `draw`, `away` (suma ~1.0) | Krytyczny |
| PRED-02 | Zapis predykcji (Limit < 50) | Status 201, rekord w DB z poprawnym `user_id` | Krytyczny |
| PRED-03 | Próba zapisu 51. predykcji | Błąd 403 `PREDICTION_LIMIT_REACHED` | Wysoki |
| PRED-04 | Walidacja danych wejściowych (Zod) | Odrzucenie requestu z błędnym formatem (400) | Wysoki |
| PRED-05 | Dostęp do cudzej predykcji przez ID | Błąd 404 lub pusta odpowiedź (działanie RLS) | Krytyczny |

## 5. Narzędzia i Środowisko

*   **Framework testowy (Unit/Integration):** **Vitest** (zgodny z ekosystemem Vite/Astro).
*   **Testy E2E:** **Playwright** (pozwala na łatwe testowanie flow auth i interceptowanie requestów sieciowych do mockowania).
*   **Testy API (Manualne/Automatyczne):** **Postman** (z wykorzystaniem kolekcji i skryptów testowych JS).
*   **Baza danych testowa:** Lokalna instancja Supabase (Docker) lub oddzielny projekt Supabase "Staging". **Nigdy nie uruchamiać testów czyszczących dane na bazie produkcyjnej.**

## 6. Harmonogram i Procedury

### Procedura CI/CD (GitHub Actions)
1.  **Lint & Type Check:** Uruchamiane przy każdym Pushu (`eslint`, `tsc`).
2.  **Unit & Integration Tests:** Uruchamiane przy każdym Pull Request (Vitest). Muszą przejść w 100%.
3.  **E2E Tests (Mocked):** Uruchamiane przy Merge do `main` lub na żądanie.

### Raportowanie Błędów
Błędy należy zgłaszać w systemie GitHub Issues z etykietą `bug`, zawierając:
1.  Kroki do reprodukcji.
2.  Oczekiwane vs Otrzymane zachowanie.
3.  Logi z konsoli/backendu.
4.  Priorytet (Blocker, Critical, Major, Minor).

## 7. Kryteria Akceptacji (Definition of Done dla testów)
1.  Coverage (pokrycie kodu) dla serwisów (`src/lib/services`) wynosi min. **80%**.
2.  Wszystkie krytyczne scenariusze (oznaczone jako "Krytyczny" i "Wysoki") przechodzą pomyślnie (Pass).
3.  Polityki RLS zostały zweryfikowane testami negatywnymi (próba nieautoryzowanego dostępu).
4.  Brak błędów walidacji typów (TypeScript) i lintera.
5.  Aplikacja poprawnie obsługuje brak dostępności zewnętrznych API (Graceful degradation).

