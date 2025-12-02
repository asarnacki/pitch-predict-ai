<architecture_analysis>

1.  **Wszystkie komponenty**:
    - **Strony Astro**: `login.astro`, `register.astro`, `reset-password.astro`, `update-password.astro`.
    - **Layout Astro**: `Layout.astro` (główny layout aplikacji).
    - **Komponenty React**: `AuthForm.tsx` (uniwersalny formularz), `UserNav.tsx` (nawigacja użytkownika), komponenty dla resetowania i aktualizacji hasła.

2.  **Główne strony i ich komponenty**:
    - **`src/layouts/Layout.astro`**: Zawiera komponent `UserNav.tsx`, który jest renderowany na każdej stronie.
    - **`src/pages/login.astro`**: Zawiera `<AuthForm mode='login' client:load />`.
    - **`src/pages/register.astro`**: Zawiera `<AuthForm mode='register' client:load />`.
    - **`src/pages/reset-password.astro`**: Będzie zawierać dedykowany komponent React do wysłania prośby o reset.
    - **`src/pages/update-password.astro`**: Będzie zawierać dedykowany komponent React do ustawienia nowego hasła.

3.  **Przepływ danych**:
    - `Layout.astro` odczytuje stan zalogowania z `Astro.locals.user` (dostarczone przez middleware) i przekazuje go jako _prop_ do `UserNav.tsx`.
    - `AuthForm.tsx` zarządza swoim wewnętrznym stanem (dane formularza, błędy, stan ładowania).
    - Po wysłaniu formularza, `AuthForm.tsx` komunikuje się z API Astro (`/api/auth/*`).
    - Po pomyślnej operacji, `AuthForm.tsx` wykonuje przekierowanie po stronie klienta (`window.location.href`).

4.  **Opis funkcjonalności każdego komponentu**:
    _ **`Layout.astro`**: Główna struktura HTML strony, zawiera nagłówek, stopkę i slot na treść. Odpowiada za przekazanie stanu sesji do komponentów UI.
    _ **`UserNav.tsx`**: Komponent wyświetlany w nagłówku. Warunkowo renderuje linki "Zaloguj się"/"Zarejestruj się" lub informacje o użytkowniku i przycisk "Wyloguj się".
    _ **`AuthForm.tsx`**: Uniwersalny, interaktywny formularz React do logowania i rejestracji. Obsługuje walidację po stronie klienta (`zod`, `react-hook-form`), komunikację z API i wyświetlanie błędów.
    _ **`ResetPasswordForm.tsx` (planowany)**: Prosty formularz z jednym polem na e-mail do zainicjowania procesu resetowania hasła. \* **`UpdatePasswordForm.tsx` (planowany)**: Formularz z polem na nowe hasło, używany na stronie, na którą trafia użytkownik po kliknięciu linku z e-maila.
    </architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
    subgraph "Astro (SSR & Routing)"
        Layout["src/layouts/Layout.astro"]

        subgraph "Strony"
            direction LR
            LoginPage["src/pages/login.astro"]
            RegisterPage["src/pages/register.astro"]
            ResetPage["src/pages/reset-password.astro"]
            UpdatePage["src/pages/update-password.astro"]
        end
    end

    subgraph "React (Interaktywne UI)"
        UserNav["UserNav.tsx"]
        AuthForm["AuthForm.tsx"]
        ResetForm["ResetPasswordForm.tsx"]
        UpdateForm["UpdatePasswordForm.tsx"]
    end

    subgraph "Backend"
        Middleware["Astro Middleware"]
        ApiEndpoints["API Endpoints </br> (/api/auth/*)"]
    end

    %% Definicje stylów
    classDef astro fill:#f2f2f2,stroke:#ff5e00,stroke-width:2px;
    classDef react fill:#e6f7ff,stroke:#007acc,stroke-width:2px;
    classDef backend fill:#f0fff0,stroke:#2e8b57,stroke-width:2px;

    class Layout,LoginPage,RegisterPage,ResetPage,UpdatePage astro;
    class UserNav,AuthForm,ResetForm,UpdateForm react;
    class Middleware,ApiEndpoints backend;

    %% Relacje
    Middleware -- "Astro.locals.user" --> Layout
    Layout -- "Renderuje" --> UserNav
    Layout -- "Renderuje" --> LoginPage
    Layout -- "Renderuje" --> RegisterPage
    Layout -- "Renderuje" --> ResetPage
    Layout -- "Renderuje" --> UpdatePage

    LoginPage -- "Zawiera" --> AuthForm
    RegisterPage -- "Zawiera" --> AuthForm
    ResetPage -- "Zawiera" --> ResetForm
    UpdatePage -- "Zawiera" --> UpdateForm

    AuthForm -- "fetch" --> ApiEndpoints
    ResetForm -- "fetch" --> ApiEndpoints
    UpdateForm -- "fetch" --> ApiEndpoints
    UserNav -- "POST /api/auth/logout" --> ApiEndpoints
```

</mermaid_diagram>
