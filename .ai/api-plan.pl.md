# Plan REST API - PitchPredict AI

## 1. Zasoby

### Główne Zasoby

| Zasób         | Tabela w bazie danych | Opis                                                                         |
| ------------- | --------------------- | ---------------------------------------------------------------------------- |
| **Profile**   | `public.profiles`     | Dane profilu użytkownika, relacja 1:1 z `auth.users`                         |
| **Predykcje** | `public.predictions`  | Zapisane przez użytkownika predykcje meczów z denormalizowanymi danymi meczu |

### Zasoby Zewnętrzne (Proxy)

| Zasób             | Zewnętrzne źródło     | Opis                                                  |
| ----------------- | --------------------- | ----------------------------------------------------- |
| **Mecze**         | API football-data.org | Nadchodzące mecze dla wspieranych lig                 |
| **Predykcje AI**  | API OpenRouter.ai     | Prawdopodobieństwa wyniku meczu wygenerowane przez AI |
| **Wyniki Meczów** | API football-data.org | Końcowe wyniki zakończonych meczów                    |

---

## 2. Endpointy

### 2.1 Endpointy Profilu

#### GET `/api/profile`

Pobierz profil aktualnie uwierzytelnionego użytkownika.

**Uwierzytelnianie**: Wymagane (token Bearer w nagłówku Authorization)

**Parametry zapytania**: Brak

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `404 Not Found`: Profil nie istnieje

```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Nie znaleziono profilu użytkownika"
  }
}
```

---

### 2.2 Endpointy Meczów

#### GET `/api/matches`

Pobierz nadchodzące mecze dla określonej ligi.

**Uwierzytelnianie**: Opcjonalne (działa zarówno dla uwierzytelnionych, jak i anonimowych użytkowników)

**Parametry zapytania**:
| Parametr | Typ | Wymagany | Opis | Wartości |
|---|---|---|---|---|
| `league` | string | Tak | Identyfikator ligi | `PL` (Premier League), `PD` (La Liga), `BL1` (Bundesliga) |
| `limit` | integer | Nie | Liczba meczów do zwrócenia (domyślnie: 20, maks: 50) | 1-50 |

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "league": "PL",
    "matches": [
      {
        "id": "match_12345",
        "home_team": "Arsenal FC",
        "away_team": "Chelsea FC",
        "match_date": "2024-01-20T15:00:00Z",
        "league": "Premier League",
        "status": "SCHEDULED"
      },
      {
        "id": "match_12346",
        "home_team": "Manchester United",
        "away_team": "Liverpool FC",
        "match_date": "2024-01-21T17:30:00Z",
        "league": "Premier League",
        "status": "SCHEDULED"
      }
    ],
    "cached_at": "2024-01-15T10:00:00Z"
  }
}
```

**Odpowiedzi błędów**:

- `400 Bad Request`: Nieprawidłowy parametr ligi

```json
{
  "error": {
    "code": "INVALID_LEAGUE",
    "message": "Liga musi być jedną z: PL, PD, BL1"
  }
}
```

- `503 Service Unavailable`: Zewnętrzne API niedostępne

```json
{
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Nie można teraz pobrać meczów"
  }
}
```

**Strategia Cachingowa**: Wyniki są przechowywane w pamięci podręcznej przez 1 godzinę, aby zmniejszyć liczbę wywołań zewnętrznego API.

---

### 2.3 Endpointy Predykcji AI

#### POST `/api/predictions/generate`

Wygeneruj predykcję AI dla określonego meczu.

**Uwierzytelnianie**: Opcjonalne (działa zarówno dla uwierzytelnionych, jak i anonimowych użytkowników)

**Parametry zapytania**: Brak

**Ciało żądania**:

```json
{
  "match_id": "match_12345",
  "home_team": "Arsenal FC",
  "away_team": "Chelsea FC",
  "league": "Premier League",
  "match_date": "2024-01-20T15:00:00Z"
}
```

**Walidacja żądania**:

- `match_id`: wymagany, niepusty ciąg znaków
- `home_team`: wymagany, niepusty ciąg znaków
- `away_team`: wymagany, niepusty ciąg znaków
- `league`: wymagany, jeden z: "Premier League", "La Liga", "Bundesliga"
- `match_date`: wymagany, prawidłowy znacznik czasu ISO 8601

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "match_id": "match_12345",
    "home_team": "Arsenal FC",
    "away_team": "Chelsea FC",
    "league": "Premier League",
    "match_date": "2024-01-20T15:00:00Z",
    "prediction": {
      "home": 0.52,
      "draw": 0.28,
      "away": 0.2
    },
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Odpowiedzi błędów**:

- `400 Bad Request`: Nieprawidłowe ciało żądania

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Podano nieprawidłowe dane meczu",
    "details": {
      "field": "league",
      "issue": "Musi być jedną z: Premier League, La Liga, Bundesliga"
    }
  }
}
```

- `503 Service Unavailable`: Usługa AI niedostępna

```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Nie można teraz wygenerować predykcji"
  }
}
```

**Strategia Cachingowa**: Wyniki są przechowywane w pamięci podręcznej według `match_id` przez 6 godzin, aby zmniejszyć koszty API AI.

---

### 2.4 Endpointy Zapisanych Predykcji

#### POST `/api/predictions`

Zapisz wygenerowaną predykcję na listę obserwowanych przez użytkownika.

**Uwierzytelnianie**: Wymagane

**Parametry zapytania**: Brak

**Ciało żądania**:

```json
{
  "league": "Premier League",
  "match_date": "2024-01-20T15:00:00Z",
  "home_team": "Arsenal FC",
  "away_team": "Chelsea FC",
  "prediction_result": {
    "home": 0.52,
    "draw": 0.28,
    "away": 0.2
  },
  "note": "Wysoka pewność wygranej gospodarzy na podstawie ostatniej formy"
}
```

**Walidacja żądania**:

- `league`: wymagany, niepusty ciąg znaków
- `match_date`: wymagany, prawidłowy znacznik czasu ISO 8601
- `home_team`: wymagany, niepusty ciąg znaków
- `away_team`: wymagany, niepusty ciąg znaków
- `prediction_result`: wymagany, obiekt z trzema wartościami numerycznymi (home, draw, away), których suma wynosi ~1.0
- `note`: opcjonalny, maks. 500 znaków

**Odpowiedź sukcesu** (201 Created):

```json
{
  "data": {
    "id": 1234,
    "created_at": "2024-01-15T10:30:00Z",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "league": "Premier League",
    "match_date": "2024-01-20T15:00:00Z",
    "home_team": "Arsenal FC",
    "away_team": "Chelsea FC",
    "prediction_result": {
      "home": 0.52,
      "draw": 0.28,
      "away": 0.2
    },
    "note": "Wysoka pewność wygranej gospodarzy na podstawie ostatniej formy",
    "home_score": null,
    "away_score": null
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `400 Bad Request`: Błąd walidacji

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowe dane predykcji",
    "details": {
      "field": "note",
      "issue": "Musi mieć 500 znaków lub mniej"
    }
  }
}
```

- `403 Forbidden`: Osiągnięto limit predykcji

```json
{
  "error": {
    "code": "PREDICTION_LIMIT_REACHED",
    "message": "Osiągnięto maksymalną liczbę 50 zapisanych predykcji. Usuń niektóre predykcje, aby dodać nowe."
  }
}
```

**Logika Biznesowa**:

- Wymusza limit 50 predykcji na użytkownika
- Automatycznie ustawia `user_id` z uwierzytelnionej sesji
- Ustawia `home_score` i `away_score` początkowo na null

---

#### GET `/api/predictions`

Pobierz wszystkie zapisane predykcje dla uwierzytelnionego użytkownika.

**Uwierzytelnianie**: Wymagane

**Parametry zapytania**:
| Parametr | Typ | Wymagany | Opis | Wartości |
|---|---|---|---|---|
| `limit` | integer | Nie | Liczba predykcji na stronę (domyślnie: 20, maks: 50) | 1-50 |
| `offset` | integer | Nie | Liczba predykcji do pominięcia (domyślnie: 0) | ≥0 |
| `sort` | string | Nie | Pole sortowania (domyślnie: created_at) | `created_at`, `match_date` |
| `order` | string | Nie | Kierunek sortowania (domyślnie: desc) | `asc`, `desc` |
| `league` | string | Nie | Filtruj według ligi | Dowolna nazwa ligi |

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "predictions": [
      {
        "id": 1234,
        "created_at": "2024-01-15T10:30:00Z",
        "league": "Premier League",
        "match_date": "2024-01-20T15:00:00Z",
        "home_team": "Arsenal FC",
        "away_team": "Chelsea FC",
        "prediction_result": {
          "home": 0.52,
          "draw": 0.28,
          "away": 0.2
        },
        "note": "Wysoka pewność wygranej gospodarzy",
        "home_score": null,
        "away_score": null
      },
      {
        "id": 1235,
        "created_at": "2024-01-14T09:15:00Z",
        "league": "La Liga",
        "match_date": "2024-01-19T20:00:00Z",
        "home_team": "Real Madrid",
        "away_team": "Barcelona",
        "prediction_result": {
          "home": 0.45,
          "draw": 0.3,
          "away": 0.25
        },
        "note": "El Clásico - wszystko może się zdarzyć",
        "home_score": 2,
        "away_score": 1
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `400 Bad Request`: Nieprawidłowe parametry zapytania

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Nieprawidłowe parametry zapytania",
    "details": {
      "field": "limit",
      "issue": "Musi być między 1 a 50"
    }
  }
}
```

**Logika Biznesowa**:

- Zwraca tylko predykcje należące do uwierzytelnionego użytkownika (wymuszone przez RLS)
- Domyślne sortowanie: najnowsze najpierw (created_at desc)
- Zawiera metadane paginacji

---

#### GET `/api/predictions/:id`

Pobierz konkretną zapisaną predykcję według ID.

**Uwierzytelnianie**: Wymagane

**Parametry ścieżki**:
| Parametr | Typ | Opis |
|---|---|---|
| `id` | integer | ID predykcji |

**Parametry zapytania**: Brak

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "id": 1234,
    "created_at": "2024-01-15T10:30:00Z",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "league": "Premier League",
    "match_date": "2024-01-20T15:00:00Z",
    "home_team": "Arsenal FC",
    "away_team": "Chelsea FC",
    "prediction_result": {
      "home": 0.52,
      "draw": 0.28,
      "away": 0.2
    },
    "note": "Wysoka pewność wygranej gospodarzy",
    "home_score": null,
    "away_score": null
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `404 Not Found`: Predykcja nie znaleziona lub nie należy do użytkownika

```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Nie znaleziono predykcji"
  }
}
```

---

#### PATCH `/api/predictions/:id`

Zaktualizuj notatkę dla zapisanej predykcji.

**Uwierzytelnianie**: Wymagane

**Parametry ścieżki**:
| Parametr | Typ | Opis |
|---|---|---|
| `id` | integer | ID predykcji |

**Parametry zapytania**: Brak

**Ciało żądania**:

```json
{
  "note": "Zaktualizowana analiza po sprawdzeniu wiadomości o drużynie"
}
```

**Walidacja żądania**:

- `note`: opcjonalny, maks. 500 znaków (może być null, aby wyczyścić notatkę)

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "id": 1234,
    "created_at": "2024-01-15T10:30:00Z",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "league": "Premier League",
    "match_date": "2024-01-20T15:00:00Z",
    "home_team": "Arsenal FC",
    "away_team": "Chelsea FC",
    "prediction_result": {
      "home": 0.52,
      "draw": 0.28,
      "away": 0.2
    },
    "note": "Zaktualizowana analiza po sprawdzeniu wiadomości o drużynie",
    "home_score": null,
    "away_score": null
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `404 Not Found`: Predykcja nie znaleziona lub nie należy do użytkownika

```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Nie znaleziono predykcji"
  }
}
```

- `400 Bad Request`: Błąd walidacji

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidłowe dane notatki",
    "details": {
      "field": "note",
      "issue": "Musi mieć 500 znaków lub mniej"
    }
  }
}
```

**Logika Biznesowa**:

- Pozwala na aktualizację tylko pola `note`
- Inne pola (`prediction_result`, drużyny, itp.) są niezmienne
- RLS zapewnia, że użytkownik może aktualizować tylko własne predykcje

---

#### DELETE `/api/predictions/:id`

Usuń zapisaną predykcję.

**Uwierzytelnianie**: Wymagane

**Parametry ścieżki**:
| Parametr | Typ | Opis |
|---|---|---|
| `id` | integer | ID predykcji |

**Parametry zapytania**: Brak

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (204 No Content)

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `404 Not Found`: Predykcja nie znaleziona lub nie należy do użytkownika

```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Nie znaleziono predykcji"
  }
}
```

**Logika Biznesowa**:

- RLS zapewnia, że użytkownik może usuwać tylko własne predykcje
- Usuwanie kaskadowe jest obsługiwane na poziomie bazy danych

---

#### POST `/api/predictions/:id/fetch-result`

Pobierz i zapisz w pamięci podręcznej końcowy wynik meczu dla zakończonego meczu.

**Uwierzytelnianie**: Wymagane

**Parametry ścieżki**:
| Parametr | Typ | Opis |
|---|---|---|
| `id` | integer | ID predykcji |

**Parametry zapytania**: Brak

**Ciało żądania**: Brak

**Odpowiedź sukcesu** (200 OK):

```json
{
  "data": {
    "id": 1234,
    "created_at": "2024-01-15T10:30:00Z",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "league": "Premier League",
    "match_date": "2024-01-20T15:00:00Z",
    "home_team": "Arsenal FC",
    "away_team": "Chelsea FC",
    "prediction_result": {
      "home": 0.52,
      "draw": 0.28,
      "away": 0.2
    },
    "note": "Wysoka pewność wygranej gospodarzy",
    "home_score": 2,
    "away_score": 1
  }
}
```

**Odpowiedzi błędów**:

- `401 Unauthorized`: Użytkownik nieuwierzytelniony

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

- `404 Not Found`: Predykcja nie znaleziona lub nie należy do użytkownika

```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Nie znaleziono predykcji"
  }
}
```

- `409 Conflict`: Mecz się jeszcze nie zakończył

```json
{
  "error": {
    "code": "MATCH_NOT_FINISHED",
    "message": "Wynik meczu nie jest jeszcze dostępny"
  }
}
```

- `503 Service Unavailable`: Zewnętrzne API niedostępne

```json
{
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Nie można teraz pobrać wyniku meczu"
  }
}
```

**Logika Biznesowa**:

- Pobiera wynik z API football-data.org
- Zapisuje wynik w polach `home_score` i `away_score`
- Kolejne wywołania zwracają wynik z pamięci podręcznej (bez wywołania zewnętrznego API)
- Działa tylko dla zakończonych meczów

---

## 3. Uwierzytelnianie i Autoryzacja

### Mechanizm Uwierzytelniania

Aplikacja używa **Supabase Auth** z uwierzytelnianiem opartym na JWT (JSON Web Token):

1. **Rejestracja/Logowanie Użytkownika**: Obsługiwane przez usługę Supabase Auth
2. **Zarządzanie Sesją**: Supabase SDK zarządza tokenami sesji (token dostępu + token odświeżania)
3. **Przechowywanie Tokenów**: Tokeny przechowywane w ciasteczkach przeglądarki (httpOnly, secure)
4. **Walidacja Tokenów**: Middleware po stronie serwera waliduje JWT na chronionych endpointach

### Szczegóły Implementacji

#### Po stronie klienta (Astro + React)

```typescript
// Inicjalizacja klienta Supabase
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

#### Po stronie serwera (Astro Middleware)

```typescript
// /src/middleware/index.ts
// Waliduj JWT i dołącz kontekst użytkownika do żądania
export async function onRequest(context, next) {
  const token = context.cookies.get("sb-access-token");

  if (token) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (!error && user) {
      context.locals.user = user;
    }
  }

  return next();
}
```

### Poziomy Autoryzacji

#### Publiczne Endpointy (Nie wymagają uwierzytelniania)

- `GET /api/matches`
- `POST /api/predictions/generate`

#### Chronione Endpointy (Wymagają uwierzytelniania)

- `GET /api/profile`
- `POST /api/predictions`
- `GET /api/predictions`
- `GET /api/predictions/:id`
- `PATCH /api/predictions/:id`
- `DELETE /api/predictions/:id`
- `POST /api/predictions/:id/fetch-result`

### Row Level Security (RLS)

Baza danych wymusza izolację danych za pomocą Row Level Security w PostgreSQL:

#### Tabela `Profiles`

- **SELECT**: Użytkownicy mogą przeglądać tylko własny profil (`auth.uid() = id`)
- **UPDATE**: Użytkownicy mogą aktualizować tylko własny profil (`auth.uid() = id`)
- **INSERT**: Zablokowane (profile tworzone automatycznie przez trigger)
- **DELETE**: Zablokowane (usuwanie profilu obsługiwane przez Supabase Auth)

#### Tabela `Predictions`

- **SELECT**: Użytkownicy mogą przeglądać tylko własne predykcje (`auth.uid() = user_id`)
- **INSERT**: Użytkownicy mogą wstawiać predykcje tylko z własnym `user_id` (`auth.uid() = user_id`)
- **UPDATE**: Użytkownicy mogą aktualizować tylko własne predykcje (`auth.uid() = user_id`)
- **DELETE**: Użytkownicy mogą usuwać tylko własne predykcje (`auth.uid() = user_id`)

**Uwaga**: Zgodnie z migracją `20251022120100_drop_rls_policies.sql`, wszystkie polityki RLS zostały usunięte. Te polityki muszą zostać odtworzone w kolejnej migracji, aby aplikacja działała bezpiecznie.

---

## 4. Walidacja i Logika Biznesowa

### Reguły Walidacji

#### Zasób `Predictions`

**Walidacja Pól**:
| Pole | Reguły |
|---|---|
| `league` | Wymagany, niepusty ciąg znaków |
| `match_date` | Wymagany, prawidłowy znacznik czasu ISO 8601 |
| `home_team` | Wymagany, niepusty ciąg znaków |
| `away_team` | Wymagany, niepusty ciąg znaków |
| `prediction_result` | Wymagany, prawidłowy obiekt JSON z właściwościami `home`, `draw`, `away` (wszystkie liczby 0-1, suma ≈ 1.0) |
| `note` | Opcjonalny, maks. 500 znaków |
| `home_score` | Opcjonalna liczba całkowita, ≥ 0 |
| `away_score` | Opcjonalna liczba całkowita, ≥ 0 |

**Ograniczenia Bazy Danych**:

- `id`: Automatycznie inkrementowany klucz główny
- `created_at`: Automatycznie generowany znacznik czasu
- `user_id`: Musi odnosić się do istniejącego profilu, usuwanie kaskadowe
- Wszystkie ograniczenia NOT NULL wymuszone na poziomie bazy danych

### Implementacja Logiki Biznesowej

#### BL-001: Limit 50 Predykcji (FR-017)

**Lokalizacja**: Endpoint `POST /api/predictions`

**Logika**:

```typescript
async function canCreatePrediction(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return count < 50;
}
```

**Odpowiedź błędu**: `403 Forbidden` z kodem `PREDICTION_LIMIT_REACHED`

---

#### BL-002: Automatyczne Tworzenie Profilu (Wymaganie schematu bazy danych)

**Lokalizacja**: Trigger bazy danych `on_auth_user_created`

**Logika**: Kiedy nowy użytkownik rejestruje się przez Supabase Auth, trigger automatycznie tworzy odpowiadający mu rekord profilu z tym samym UUID.

**Implementacja**: Już obsłużone przez funkcję triggera migracji bazy danych `handle_new_user()`

---

#### BL-003: Niezmienne Dane Predykcji

**Lokalizacja**: Endpoint `PATCH /api/predictions/:id`

**Logika**: Tylko pole `note` może być aktualizowane. Główne dane predykcji (`prediction_result`, `home_team`, `away_team`, `match_date`, `league`) są niezmienne po utworzeniu.

**Wymuszenie**:

- Walidacja po stronie serwera ignoruje wszystkie pola oprócz `note`
- Polityki RLS bazy danych zapewniają, że użytkownicy mogą aktualizować tylko własne rekordy

---

#### BL-004: Caching Wyników (FR-016, FR-018)

**Lokalizacja**: Endpoint `POST /api/predictions/:id/fetch-result`

**Logika**:

1. Sprawdź, czy `home_score` i `away_score` są już ustawione
2. Jeśli są w pamięci podręcznej, zwróć natychmiast bez wywołania zewnętrznego API
3. Jeśli nie są w pamięci podręcznej:
   - Sprawdź, czy data meczu jest w przeszłości
   - Pobierz wynik z API football-data.org
   - Zaktualizuj rekord predykcji o wyniki
   - Zwróć zaktualizowany rekord

**Korzyści**:

- Zmniejsza liczbę wywołań zewnętrznego API
- Poprawia czas odpowiedzi na powtarzające się żądania
- Obniża koszty operacyjne

---

#### BL-005: Caching Generowania Predykcji (FR-018)

**Lokalizacja**: Endpoint `POST /api/predictions/generate`

**Logika**:

1. Wygeneruj klucz pamięci podręcznej z `match_id`
2. Sprawdź pamięć podręczną (w pamięci lub Redis)
3. Jeśli jest w pamięci podręcznej i ma mniej niż 6 godzin, zwróć predykcję z pamięci podręcznej
4. W przeciwnym razie:
   - Pobierz statystyki meczu z football-data.org
   - Wywołaj OpenRouter.ai z kontekstem meczu
   - Przetwórz i zwaliduj odpowiedź AI
   - Zapisz w pamięci podręcznej z TTL 6 godzin
   - Zwróć predykcję

**Format klucza pamięci podręcznej**: `prediction:${match_id}`

**TTL**: 6 godzin (predykcje dla nadchodzących meczów mogą się zmieniać w miarę zbliżania się meczu)

---

#### BL-006: Caching Listy Meczów (FR-018)

**Lokalizacja**: Endpoint `GET /api/matches`

**Logika**:

1. Wygeneruj klucz pamięci podręcznej z kodu ligi
2. Sprawdź pamięć podręczną
3. Jeśli jest w pamięci podręcznej i ma mniej niż 1 godzinę, zwróć mecze z pamięci podręcznej
4. W przeciwnym razie:
   - Pobierz nadchodzące mecze z football-data.org
   - Filtruj mecze w ciągu najbliższych 14 dni
   - Sortuj według `match_date` rosnąco
   - Zapisz w pamięci podręcznej z TTL 1 godzina
   - Zwróć mecze

**Format klucza pamięci podręcznej**: `matches:${league_code}`

**TTL**: 1 godzina (harmonogramy meczów rzadko zmieniają się w ciągu dnia)

---

#### BL-007: Wymuszenie Kontekstu Użytkownika

**Lokalizacja**: Wszystkie uwierzytelnione endpointy

**Logika**:

- `user_id` jest zawsze ustawiany z `auth.uid()` wyodrębnionego z JWT
- Nigdy nie akceptuj `user_id` z ciała żądania
- Polityki RLS wymuszają, że użytkownik ma dostęp tylko do własnych danych

**Implementacja**:

```typescript
// Wyodrębnij ID użytkownika z uwierzytelnionej sesji
const userId = context.locals.user.id;

// Nadpisz dowolne user_id w ciele żądania
const data = {
  ...requestBody,
  user_id: userId,
};
```

---

#### BL-008: Obsługa Błędów i Logowanie

**Lokalizacja**: Wszystkie endpointy

**Logika**:

- Przechwytuj wszystkie błędy na poziomie endpointu
- Loguj błędy do usługi monitorującej (np. Sentry)
- Zwracaj przyjazne dla użytkownika komunikaty o błędach
- Nigdy nie ujawniaj wewnętrznych szczegółów (ślady stosu, błędy bazy danych)
- Używaj spójnego formatu odpowiedzi błędu

**Format Odpowiedzi Błędu**:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Kod błędu czytelny maszynowo
    message: string; // Wiadomość przyjazna dla użytkownika
    details?: any; // Opcjonalne szczegóły walidacji
  };
}
```

---

## 5. Integracja z Zewnętrznymi API

### 5.1 API Football-Data.org

**Bazowy URL**: `https://api.football-data.org/v4`

**Uwierzytelnianie**: Klucz API w nagłówku `X-Auth-Token`

**Limity zapytań**:

- Darmowy plan: 10 żądań/minutę
- Płatny plan: Dostępne wyższe limity

**Używane Endpointy**:

- `GET /competitions/{code}/matches` - Pobierz mecze dla ligi
- `GET /matches/{id}` - Pobierz szczegóły konkretnego meczu, w tym wynik końcowy

**Kody Lig**:

- Premier League: `PL`
- La Liga: `PD`
- Bundesliga: `BL1`

**Obsługa Błędów**:

- 429 Too Many Requests: Zwróć dane z pamięci podręcznej lub poczekaj i ponów próbę
- 500 Server Error: Zwróć `503 Service Unavailable` do klienta
- Błędy sieciowe: Zwróć `503 Service Unavailable` do klienta

---

### 5.2 API OpenRouter.ai

**Bazowy URL**: `https://openrouter.ai/api/v1`

**Uwierzytelnianie**: Token Bearer w nagłówku `Authorization`

**Limity zapytań**: Konfigurowalne dla każdego klucza API

**Używane Endpointy**:

- `POST /chat/completions` - Generuj predykcję meczu

**Format Żądania**:

```json
{
  "model": "meta-llama/llama-3.1-70b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "Jesteś ekspertem od przewidywania wyników meczów piłkarskich..."
    },
    {
      "role": "user",
      "content": "Przewidź wynik meczu Arsenal vs Chelsea..."
    }
  ]
}
```

**Przetwarzanie Odpowiedzi**:

- Wyodrębnij prawdopodobieństwa predykcji z odpowiedzi AI
- Sprawdź, czy wartości są między 0 a 1
- Upewnij się, że suma wynosi około 1.0
- Zaokrąglij do 2 miejsc po przecinku

**Obsługa Błędów**:

- 429 Too Many Requests: Zaimplementuj wykładnicze ponawianie
- 500 Server Error: Zwróć `503 Service Unavailable` do klienta
- Nieprawidłowa odpowiedź AI: Zwróć `503 Service Unavailable` do klienta

---

## 6. Uwagi Implementacyjne

### Integracja Stosu Technologicznego

**Astro 5**:

- Endpointy API po stronie serwera w `/src/pages/api/`
- Każdy endpoint to plik `.ts` eksportujący handlery metod HTTP
- Przykład: `/src/pages/api/predictions/index.ts` eksportuje funkcje `GET` i `POST`

**TypeScript 5**:

- Współdzielone typy w `/src/types.ts`
- Generuj typy bazy danych ze schematu Supabase
- Ścisłe sprawdzanie typów dla wszystkich payloadów API

**Supabase**:

- Inicjalizacja klienta w `/src/db/supabase.client.ts`
- Klient po stronie serwera używa klucza roli serwisowej do operacji administracyjnych
- Klient po stronie klienta używa klucza anonimowego z wymuszeniem RLS

### Strategia Cachingowa

**Opcje Implementacji**:

1. **Pamięć podręczna w pamięci** (MVP): Prosty magazyn obiektów z TTL
2. **Redis** (Produkcja): Rozproszona pamięć podręczna do skalowania

**Struktura Pamięci Podręcznej**:

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl: number): void;
  clear(key: string): void;
}
```

### Kwestie Bezpieczeństwa

1. **Walidacja Danych Wejściowych**: Waliduj wszystkie dane wejściowe po stronie serwera przed przetworzeniem
2. **Ograniczanie Zapytań**: Zaimplementuj limity zapytań na użytkownika na kosztownych endpointach
3. **CORS**: Skonfiguruj nagłówki CORS tylko dla domeny produkcyjnej
4. **SQL Injection**: Używaj sparametryzowanych zapytań (obsługiwane przez Supabase SDK)
5. **Zapobieganie XSS**: Oczyszczaj notatki użytkownika przed zapisem i wyświetleniem
6. **Ochrona CSRF**: Używaj wbudowanej ochrony CSRF Supabase do uwierzytelniania
7. **Zarządzanie Kluczami API**: Przechowuj klucze zewnętrznych API w zmiennych środowiskowych, nigdy w kodzie

### Optymalizacja Wydajności

1. **Indeksy Bazy Danych**: Indeks na `predictions.user_id` dla szybkich zapytań użytkownika
2. **Paginacja**: Zawsze paginuj endpointy list, aby zapobiec dużym payloadom
3. **Leniwe Ładowanie**: Pobieraj wyniki meczów tylko na wyraźne żądanie
4. **Pulowanie Połączeń**: Używaj wbudowanego pulowania połączeń Supabase
5. **Caching CDN**: Przechowuj w pamięci podręcznej zasoby statyczne i odpowiedzi API tam, gdzie to właściwe

### Monitorowanie i Logowanie

**Metryki do Śledzenia**:

- Czasy odpowiedzi API (p50, p95, p99)
- Wskaźniki błędów według endpointu
- Wskaźniki sukcesu/porażki zewnętrznych API
- Wskaźniki trafień/chybień pamięci podręcznej
- Aktywni użytkownicy i utworzone predykcje

**Strategia Logowania**:

- Info: Wszystkie żądania API z metodą, ścieżką, user_id, czasem trwania
- Warning: Awarie zewnętrznych API, chybienia pamięci podręcznej
- Error: Wszystkie błędy ze śladami stosu i kontekstem
