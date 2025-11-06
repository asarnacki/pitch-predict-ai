### Specyfikacja Techniczna Modułu Autentykacji - PitchPredict AI

Na podstawie analizy dokumentu wymagań produktu (`prd.md`) oraz zdefiniowanego stosu technologicznego (`tech-stack.md`), niniejsza specyfikacja opisuje architekturę i implementację modułu autentykacji dla aplikacji PitchPredict AI.

---

### 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA (FRONTEND)

Architektura frontendu zostanie oparta o Astro dla stron statycznych i renderowanych po stronie serwera oraz React dla komponentów interaktywnych.

#### 1.1. Nowe Strony (Astro)

Zostaną utworzone trzy nowe strony w katalogu `src/pages`:

*   **`src/pages/login.astro`**: Strona logowania.
    *   Będzie zawierać komponent React `AuthForm` w trybie "login".
    *   Strona będzie dostępna tylko dla niezalogowanych użytkowników. Zalogowani użytkownicy próbujący uzyskać do niej dostęp zostaną przekierowani na stronę główną (`/`).

*   **`src/pages/register.astro`**: Strona rejestracji.
    *   Będzie zawierać komponent React `AuthForm` w trybie "register".
    *   Dostępna tylko dla niezalogowanych użytkowników, z przekierowaniem dla zalogowanych.

*   **`src/pages/reset-password.astro`**: Strona do inicjowania resetu hasła.
    *   Będzie zawierać prosty formularz (komponent React) z jednym polem na adres e-mail.
    *   Dostępna tylko dla niezalogowanych użytkowników.

*   **`src/pages/update-password.astro`**: Strona do ustawiania nowego hasła po kliknięciu w link z maila.
    *   Supabase Auth obsługuje tę stronę, ale musimy stworzyć jej implementację w naszej aplikacji, która obsłuży token z URL i pozwoli użytkownikowi ustawić nowe hasło.
    *   Będzie zawierać formularz (komponent React) z polem na nowe hasło.

#### 1.2. Nowe Komponenty (React)

*   **`src/components/AuthForm.tsx`**: Uniwersalny komponent formularza dla logowania i rejestracji.
    *   **Props**: `mode: 'login' | 'register'`.
    *   **Stan**: Będzie zarządzał stanem pól formularza (email, hasło), stanem ładowania (submitting) oraz błędami walidacji i błędami z API.
    *   **Logika**:
        *   Renderuje pola "E-mail" i "Hasło". W trybie `register` może dodatkowo renderować pole "Potwierdź hasło".
        *   Obsługuje walidację po stronie klienta (np. format e-mail, minimalna długość hasła) przy użyciu biblioteki `zod` i `react-hook-form`.
        *   Po wysłaniu formularza, wykonuje asynchroniczne zapytanie `fetch` do odpowiedniego endpointu API Astro (`/api/auth/login` lub `/api/auth/register`).
        *   Wyświetla komunikaty o błędach (np. "Nieprawidłowe dane logowania", "Użytkownik o tym e-mailu już istnieje") otrzymane z API.
        *   Po pomyślnej autentykacji, przekierowuje użytkownika na stronę główną (`window.location.href = '/'`).

*   **`src/components/UserNav.tsx`**: Komponent wyświetlany w nagłówku.
    *   **Logika**:
        *   Jeśli użytkownik jest **niezalogowany**, wyświetla linki/przyciski "Zaloguj się" i "Zarejestruj się".
        *   Jeśli użytkownik jest **zalogowany**, wyświetla np. awatar lub email użytkownika oraz przycisk "Wyloguj się". Przycisk ten będzie wysyłał zapytanie `POST` do `/api/auth/logout`.

#### 1.3. Modyfikacja Istniejących Elementów

*   **`src/layouts/Layout.astro`**: Główny layout aplikacji.
    *   Zostanie zmodyfikowany, aby zawierał komponent `UserNav.tsx`.
    *   Będzie odczytywał stan zalogowania użytkownika z `Astro.locals.user` (dostarczone przez middleware) i przekazywał go jako prop do `UserNav.tsx`.
    *   Dzięki temu `UserNav` będzie renderowany poprawnie po stronie serwera, bez migotania (FOUC).

*   **Komponenty wymagające autentykacji**:
    *   Komponenty takie jak `SavePredictionForm.tsx` (FR-011) i widok "Obserwowane mecze" (FR-013) będą musiały zostać dostosowane.
    *   Jeśli użytkownik jest niezalogowany, przycisk "Zapisz do obserwowanych" powinien być nieaktywny lub powinien wyświetlać prośbę o zalogowanie.
    *   Próba dostępu do strony "Obserwowane mecze" przez niezalogowanego użytkownika powinna skutkować przekierowaniem na stronę logowania.

#### 1.4. Scenariusze i Obsługa Błędów

*   **Walidacja formularzy**: Komunikaty będą wyświetlane pod odpowiednimi polami (np. "Nieprawidłowy format e-maila", "Hasło musi mieć co najmniej 8 znaków").
*   **Błędy API**: Generyczny komunikat o błędzie (np. przy użyciu `sonner` z shadcn/ui) będzie wyświetlany na formularzu, jeśli API zwróci błąd serwera (500) lub błąd logowania (401/400).
*   **Stany ładowania**: Przyciski "Zaloguj się" / "Zarejestruj się" będą nieaktywne i będą wyświetlać spinner podczas trwania zapytania do API.

---

### 2. LOGIKA BACKENDOWA (ASTRO API & MIDDLEWARE)

Backend będzie oparty o Astro API Routes oraz middleware do obsługi sesji.

#### 2.1. Kluczowa decyzja architektoniczna: Zarządzanie sesją (Ciasteczka vs. Bearer Token)

-   **Wybrana metoda**: Sesja oparta na **ciasteczkach (cookies)**, zarządzana przez biblioteki pomocnicze Supabase (`@supabase/auth-helpers-astro`).
-   **Uzasadnienie**:
    -   **Bezpieczeństwo**: Ciasteczka z flagami `HttpOnly` i `Secure` są standardem branżowym dla aplikacji webowych, ponieważ chronią tokeny przed dostępem przez złośliwy kod JavaScript (XSS).
    -   **Integracja z SSR**: Astro, jako framework renderujący po stronie serwera, może natychmiastowo odczytać stan zalogowania z ciasteczek w `middleware`. Umożliwia to renderowanie odpowiedniego UI (np. "Wyloguj się" vs "Zaloguj się") bez migotania (FOUC), co jest trudne do osiągnięcia z tokenami przechowywanymi w `localStorage`.
    -   **Prostota**: Auth helpers automatyzują proces odświeżania i zarządzania tokenami, co upraszcza kod zarówno po stronie klienta, jak i serwera.
-   **Uwaga**: Wczesna implementacja `middleware` (udokumentowana w `session-summary.md`) wykorzystywała nagłówek `Authorization: Bearer`. Należy to traktować jako rozwiązanie tymczasowe, przydatne do testów API w Postmanie. **Finalna implementacja musi być oparta o ciasteczka**, aby zapewnić spójne i bezpieczne działanie całej aplikacji.

#### 2.2. Middleware

*   **`src/middleware/index.ts`**:
    *   Będzie przechwytywał każde zapytanie przychodzące do serwera.
    *   Odczyta token JWT z ciasteczek (`Astro.cookies`). Supabase SDK automatycznie zarządza ciasteczkami sesji.
    *   Użyje `supabase.auth.getUser()` z tokenem z ciasteczka, aby zweryfikować sesję użytkownika.
    *   Jeśli użytkownik jest zalogowany, jego dane (ID, e-mail) zostaną dodane do `Astro.locals.user`. `Astro.locals` to obiekt kontekstowy dostępny w endpointach API i stronach `.astro`.
    *   Zaimplementuje logikę ochrony tras:
        *   Jeśli niezalogowany użytkownik próbuje uzyskać dostęp do chronionej strony (np. `/profile`, `/predictions`), zostanie przekierowany na `/login`.
        *   Jeśli zalogowany użytkownik próbuje uzyskać dostęp do `/login` lub `/register`, zostanie przekierowany na `/`.
    *   To centralne miejsce do zarządzania sesją zapewni spójność w całej aplikacji.

#### 2.3. Endpointy API

Wszystkie endpointy będą znajdować się w `src/pages/api/auth/`. Będą one bezstanowe i będą polegać na Supabase SDK do interakcji z usługą autentykacji.

*   **`POST /api/auth/register`**:
    *   **Model Danych (Request)**: `{ email: string, password: string }`.
    *   **Walidacja**: Użyje `zod` do walidacji `email` (poprawny format) i `password` (minimalna długość). W przypadku błędu zwróci status 400 z informacją o błędach.
    *   **Logika**:
        1.  Wywoła `supabase.auth.signUp({ email, password })`.
        2.  Jeśli rejestracja się powiedzie, Supabase automatycznie zaloguje użytkownika i ustawi odpowiednie ciasteczka sesji. Endpoint zwróci status 200 z danymi użytkownika.
        3.  Jeśli użytkownik już istnieje, Supabase zwróci błąd, który zostanie przechwycony i przekazany do frontendu ze statusem 409 (Conflict).
    *   **Model Danych (Response)**: `{ user: { id, email, ... } }`.

*   **`POST /api/auth/login`**:
    *   **Model Danych (Request)**: `{ email: string, password: string }`.
    *   **Walidacja**: `zod` dla `email` i `password`.
    *   **Logika**:
        1.  Wywoła `supabase.auth.signInWithPassword({ email, password })`.
        2.  W przypadku sukcesu, Supabase ustawi ciasteczka sesji, a endpoint zwróci 200 z danymi użytkownika.
        3.  W przypadku niepoprawnych danych, zwróci status 401 (Unauthorized) z komunikatem błędu.
    *   **Model Danych (Response)**: `{ user: { id, email, ... } }`.

*   **`POST /api/auth/logout`**:
    *   **Model Danych (Request)**: Brak.
    *   **Logika**:
        1.  Wywoła `supabase.auth.signOut()`.
        2.  To unieważni sesję użytkownika i usunie ciasteczka.
        3.  Zwróci status 200.
    *   **Model Danych (Response)**: `{ message: 'Logged out successfully' }`.

*   **`POST /api/auth/reset-password`**:
    *   **Model Danych (Request)**: `{ email: string }`.
    *   **Logika**:
        1.  Wywoła `supabase.auth.resetPasswordForEmail(email)`.
        2.  Supabase wyśle e-mail z linkiem do resetowania hasła.
        3.  Endpoint zawsze zwróci status 200, aby uniemożliwić zgadywanie, czy dany e-mail istnieje w bazie.
    *   **Model Danych (Response)**: `{ message: 'If an account exists, a password reset link has been sent.' }`.

*   **`POST /api/auth/update-password`**:
    *   **Model Danych (Request)**: `{ password: string }`.
    *   **Logika**:
        1.  Wymaga aktywnej sesji użytkownika, która jest nawiązywana po kliknięciu w link resetujący. Middleware musi poprawnie obsłużyć ten tymczasowy stan.
        2.  Wywoła `supabase.auth.updateUser({ password })`.
        3.  Zwróci 200 w przypadku sukcesu lub 400 w przypadku błędu (np. zbyt słabe hasło).

#### 2.4. Renderowanie Server-Side

Dzięki middleware, każda strona `.astro` (renderowana na serwerze, zgodnie z `astro.config.mjs`) będzie miała dostęp do `Astro.locals.user`. Pozwoli to na warunkowe renderowanie komponentów w zależności od stanu zalogowania, np.:

```astro
---
// src/layouts/Layout.astro
import UserNav from '../components/UserNav.tsx';
const user = Astro.locals.user;
---
<header>
  <UserNav user={user} client:load />
</header>
```

---

### 3. SYSTEM AUTENTYKACJI (SUPABASE AUTH)

Integracja z Supabase Auth będzie sercem całego systemu.

#### 3.1. Konfiguracja

*   **Zmienne środowiskowe**: Klucze `SUPABASE_URL` i `SUPABASE_ANON_KEY` zostaną dodane do zmiennych środowiskowych projektu i będą używane do inicjalizacji klienta Supabase.
*   **Klient Supabase**: Zostanie utworzony serwerowy klient Supabase (`src/db/supabase.server.ts`) do użytku w middleware i endpointach API. Klient ten będzie inicjowany przy każdym zapytaniu, aby zapewnić izolację kontekstu.
*   **Dostawca OAuth**: Na razie skupiamy się na e-mail/hasło, ale w przyszłości można łatwo rozszerzyć o logowanie przez Google, GitHub itp. w panelu Supabase.

#### 3.2. Zarządzanie Sesją

*   **JWT i Ciasteczka**: Supabase Auth używa tokenów JWT do zarządzania sesją. Jego `auth-helpers` dla Astro (lub ręczna implementacja) zapewnią, że token jest bezpiecznie przechowywany w ciasteczkach (`httpOnly`, `secure`).
*   **Odświeżanie tokena**: Supabase SDK automatycznie zarządza odświeżaniem tokenów, więc nie jest wymagana dodatkowa logika po stronie aplikacji, o ile klient jest poprawnie skonfigurowany.

#### 3.3. Proces Resetowania Hasła (US-003)

1.  Użytkownik na stronie `/reset-password` podaje swój e-mail.
2.  Frontend wysyła zapytanie do `POST /api/auth/reset-password`.
3.  Backend wywołuje `supabase.auth.resetPasswordForEmail()`.
4.  Supabase wysyła e-mail z unikalnym linkiem (ważnym przez określony czas).
5.  Użytkownik klika w link i jest przekierowywany do strony `/update-password` w naszej aplikacji (URL skonfigurowany w panelu Supabase). URL będzie zawierał token.
6.  Na stronie `/update-password` użytkownik wprowadza nowe hasło. Formularz wysyła je do `POST /api/auth/update-password`.
7.  Astro middleware, widząc specjalny event w URL (`password_recovery`), nawiązuje sesję przy użyciu `supabase.auth.exchangeCodeForSession()`.
8.  Endpoint `update-password` wywołuje `supabase.auth.updateUser()` z nowym hasłem, co jest możliwe dzięki sesji nawiązanej w poprzednim kroku.
9.  Po pomyślnej zmianie hasła użytkownik jest przekierowywany na stronę logowania z komunikatem o sukcesie.
