# API Endpoints Implementation Plan - PitchPredict AI

## Spis treści

1. [Przegląd ogólny](#przegląd-ogólny)
2. [Wspólne komponenty](#wspólne-komponenty)
3. [Endpoint 1: GET /api/profile](#endpoint-1-get-apiprofile)
4. [Endpoint 2: GET /api/matches](#endpoint-2-get-apimatches)
5. [Endpoint 3: POST /api/predictions/generate](#endpoint-3-post-apipredictionsgenerate)
6. [Endpoint 4: POST /api/predictions](#endpoint-4-post-apipredictions)
7. [Endpoint 5: GET /api/predictions](#endpoint-5-get-apipredictions)
8. [Endpoint 6: GET /api/predictions/:id](#endpoint-6-get-apipredictionsid)
9. [Endpoint 7: PATCH /api/predictions/:id](#endpoint-7-patch-apipredictionsid)
10. [Endpoint 8: DELETE /api/predictions/:id](#endpoint-8-delete-apipredictionsid)
11. [Endpoint 9: POST /api/predictions/:id/fetch-result](#endpoint-9-post-apipredictionsidfetch-result)
12. [Bezpieczeństwo i monitoring](#bezpieczeństwo-i-monitoring)

---

## Przegląd ogólny

Ten dokument zawiera szczegółowy plan implementacji wszystkich 9 endpointów REST API dla aplikacji PitchPredict AI. Plan obejmuje strukturę zapytań, odpowiedzi, walidację, obsługę błędów, integracje z zewnętrznymi API oraz wymagania bezpieczeństwa.

### Tech Stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth), Astro API Routes
- **External APIs**: football-data.org, OpenRouter.ai
- **Validation**: Zod schemas
- **Cache**: In-memory cache z TTL (MVP), Redis (produkcja)

### Struktura projektu

```
src/
├── pages/api/              # Astro API endpoints
│   ├── profile.ts
│   ├── matches.ts
│   └── predictions/
│       ├── index.ts
│       ├── generate.ts
│       └── [id]/
│           ├── index.ts
│           └── fetch-result.ts
├── lib/
│   ├── services/           # Business logic services
│   │   ├── profile.service.ts
│   │   ├── prediction.service.ts
│   │   ├── football-data.service.ts
│   │   ├── ai-prediction.service.ts
│   │   └── cache.service.ts
│   ├── validation/         # Zod schemas
│   │   └── schemas.ts
│   └── errors/             # Custom errors
│       ├── api-errors.ts
│       └── formatter.ts
├── middleware/
│   └── index.ts            # Auth middleware
├── db/
│   ├── supabase.client.ts
│   └── database.types.ts
└── types.ts                # Shared DTOs
```

---

## Wspólne komponenty

Przed implementacją endpointów, należy stworzyć wspólne komponenty wykorzystywane przez wszystkie endpointy.

### 2.1 Cache Service

**Lokalizacja**: `src/lib/services/cache.service.ts`

**Cel**: Zarządzanie cache'owaniem odpowiedzi z external APIs (matches: 1h TTL, predictions: 6h TTL)

**Interfejs**:

```typescript
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private store: Map<string, CacheEntry<any>>;

  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl: number): void;
  clear(key: string): void;
  clearAll(): void;

  // Helper: sprawdza czy entry jest ważny
  private isValid(entry: CacheEntry<any>): boolean;
}
```

**Implementacja**:

- In-memory Map dla MVP
- TTL w milisekundach
- Auto-cleanup expired entries przy każdym get()
- Thread-safe (jeśli potrzebne w przyszłości)

**Cache Keys**:

- Matches: `matches:${leagueCode}` (np. `matches:PL`)
- AI Predictions: `prediction:${matchId}` (np. `prediction:match_12345`)

---

### 2.2 Custom Error Classes

**Lokalizacja**: `src/lib/errors/api-errors.ts`

**Cel**: Ustandaryzowane błędy API z odpowiednimi kodami HTTP

**Klasy błędów**:

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(code: string, message: string) {
    super(404, code, message);
  }
}

export class PredictionLimitError extends ApiError {
  constructor() {
    super(
      403,
      "PREDICTION_LIMIT_REACHED",
      "Maximum of 50 saved predictions reached. Please delete some predictions to add new ones."
    );
  }
}

export class ExternalServiceError extends ApiError {
  constructor(message: string) {
    super(503, "EXTERNAL_API_ERROR", message);
  }
}

export class ConflictError extends ApiError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}
```

---

### 2.3 Error Formatter

**Lokalizacja**: `src/lib/errors/formatter.ts`

**Cel**: Konwersja błędów na standardowy format ApiErrorResponse

```typescript
import type { ApiErrorResponse } from "@/types";
import { ApiError } from "./api-errors";

export function formatError(error: unknown): {
  status: number;
  body: ApiErrorResponse;
} {
  // ApiError - custom errors
  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors,
        },
      },
    };
  }

  // Generic errors - nie pokazuj szczegółów
  console.error("Unexpected error:", error);
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
  };
}
```

---

### 2.4 Validation Schemas

**Lokalizacja**: `src/lib/validation/schemas.ts`

**Cel**: Zod schemas dla wszystkich request/response typów

```typescript
import { z } from "zod";
import { LEAGUE_CODES, LEAGUE_NAMES, BUSINESS_RULES } from "@/types";

// GET /api/matches
export const getMatchesQuerySchema = z.object({
  league: z.enum([LEAGUE_CODES.PREMIER_LEAGUE, LEAGUE_CODES.LA_LIGA, LEAGUE_CODES.BUNDESLIGA]),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(BUSINESS_RULES.MAX_MATCHES_LIMIT)
    .optional()
    .default(BUSINESS_RULES.DEFAULT_MATCHES_LIMIT),
});

// POST /api/predictions/generate
export const generatePredictionBodySchema = z.object({
  match_id: z.string().min(1),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  league: z.enum([LEAGUE_NAMES.PREMIER_LEAGUE, LEAGUE_NAMES.LA_LIGA, LEAGUE_NAMES.BUNDESLIGA]),
  match_date: z.string().datetime(),
});

// POST /api/predictions
export const createPredictionBodySchema = z.object({
  league: z.string().min(1),
  match_date: z.string().datetime(),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  prediction_result: z
    .object({
      home: z.number().min(0).max(1),
      draw: z.number().min(0).max(1),
      away: z.number().min(0).max(1),
    })
    .refine((data) => Math.abs(data.home + data.draw + data.away - 1) < 0.01, {
      message: "Probabilities must sum to approximately 1.0",
    }),
  note: z.string().max(BUSINESS_RULES.MAX_NOTE_LENGTH).optional(),
});

// GET /api/predictions
export const getPredictionsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(BUSINESS_RULES.MAX_MATCHES_LIMIT)
    .optional()
    .default(BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(["created_at", "match_date"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  league: z.string().optional(),
});

// PATCH /api/predictions/:id
export const updatePredictionBodySchema = z.object({
  note: z.string().max(BUSINESS_RULES.MAX_NOTE_LENGTH).nullable().optional(),
});

// Path params
export const predictionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
```

---

### 2.5 Middleware Enhancement

**Lokalizacja**: `src/middleware/index.ts`

**Rozszerzenie istniejącego middleware**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@/db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client
  const supabase = createServerClient(context);

  // Attach to context for easy access in endpoints
  context.locals.supabase = supabase;

  // Try to get authenticated user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user && !error) {
    context.locals.user = user;
  }

  return next();
});
```

**Context.locals type enhancement** w `src/env.d.ts`:

```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user?: User;
  }
}
```

---

## Endpoint 1: GET /api/profile

### 1.1 Przegląd punktu końcowego

Endpoint zwraca profil zalogowanego użytkownika. Prosty endpoint służący do weryfikacji sesji i pobrania podstawowych danych użytkownika.

### 1.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - **Wymagane**: Brak (user_id pobierany z authenticated session)
  - **Opcjonalne**: Brak
- **Request Body**: Brak
- **Authentication**: Required (Bearer token w Authorization header lub cookie)

### 1.3 Wykorzystywane typy

**DTOs**:

- `ProfileDTO` (response) - z `src/types.ts`
- `ApiSuccessResponse<ProfileDTO>` - wrapper
- `ApiErrorResponse` - dla błędów

**Database types**:

- `Tables<'profiles'>` - typ Row z Supabase

### 1.4 Szczegóły odpowiedzi

**Success (200 OK)**:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `404 PROFILE_NOT_FOUND`: Profil nie istnieje w bazie

### 1.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza czy `context.locals.user` istnieje
3. **Service** pobiera profil z Supabase używając `user.id`
4. **RLS** zapewnia, że zwrócony jest tylko profil użytkownika
5. **Response** zwraca `ApiSuccessResponse<ProfileDTO>`

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → ProfileService → Supabase (RLS) → Response
```

### 1.6 Względy bezpieczeństwa

- **Authentication**: Wymagane JWT token (checked w middleware)
- **Authorization**: RLS policy `auth.uid() = id` zapewnia dostęp tylko do własnego profilu
- **Data validation**: Brak user input do walidacji
- **Rate limiting**: Nie wymagane (prosty read operation)

**RLS Policy** (do stworzenia w migracji):

```sql
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### 1.7 Obsługa błędów

| Kod | Error Code        | Scenariusz                          | Akcja                          |
| --- | ----------------- | ----------------------------------- | ------------------------------ |
| 401 | UNAUTHORIZED      | Brak tokena lub nieprawidłowy token | Zwróć UnauthorizedError        |
| 404 | PROFILE_NOT_FOUND | Profil nie istnieje (edge case)     | Zwróć NotFoundError            |
| 500 | INTERNAL_ERROR    | Błąd Supabase/DB                    | Log error, zwróć generic error |

**Error handling w endpoint**:

```typescript
try {
  const profile = await profileService.getProfile(userId);
  if (!profile) {
    throw new NotFoundError("PROFILE_NOT_FOUND", "User profile not found");
  }
  return { data: profile };
} catch (error) {
  const { status, body } = formatError(error);
  return new Response(JSON.stringify(body), { status });
}
```

### 1.8 Rozważania dotyczące wydajności

- **Database query**: Prosty SELECT by primary key (bardzo szybki)
- **Caching**: Nie wymagane (dane zmieniają się rzadko, query jest szybki)
- **Index**: Primary key index (już istnieje)
- **Response size**: Bardzo mały (~100 bytes)

**Potencjalne optymalizacje**:

- Brak - endpoint jest już optymalny

### 1.9 Etapy wdrożenia

1. **Stwórz ProfileService** (`src/lib/services/profile.service.ts`):

   ```typescript
   export async function getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
     const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

     if (error) throw error;
     return data;
   }
   ```

2. **Stwórz endpoint** (`src/pages/api/profile.ts`):

   ```typescript
   export const prerender = false;

   import type { APIRoute } from "astro";
   import { getProfile } from "@/lib/services/profile.service";
   import { UnauthorizedError, NotFoundError } from "@/lib/errors/api-errors";
   import { formatError } from "@/lib/errors/formatter";

   export const GET: APIRoute = async ({ locals }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Fetch profile
       const profile = await getProfile(locals.supabase, locals.user.id);

       if (!profile) {
         throw new NotFoundError("PROFILE_NOT_FOUND", "User profile not found");
       }

       return new Response(JSON.stringify({ data: profile }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

3. **Stwórz RLS policy** w nowej migracji Supabase

4. **Testuj endpoint**:
   - Test z valid token → 200 OK
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z invalid token → 401 UNAUTHORIZED
   - Test gdy profil nie istnieje → 404 PROFILE_NOT_FOUND

---

## Endpoint 2: GET /api/matches

### 2.1 Przegląd punktu końcowego

Endpoint zwraca listę nadchodzących meczów dla wybranej ligi. Pobiera dane z football-data.org API i cache'uje je na 1 godzinę. Endpoint jest publiczny (działa dla zalogowanych i niezalogowanych użytkowników).

### 2.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/matches?league={code}&limit={number}`
- **Parametry**:
  - **Wymagane**:
    - `league` (query): Kod ligi - `PL` | `PD` | `BL1`
  - **Opcjonalne**:
    - `limit` (query): Liczba meczów (1-50, default: 20)
- **Request Body**: Brak
- **Authentication**: Optional (publiczny endpoint)

### 2.3 Wykorzystywane typy

**DTOs**:

- `GetMatchesQueryParams` - query parameters
- `MatchesResponseDTO` - response (zawiera matches: MatchDTO[], cached_at)
- `MatchDTO` - pojedynczy mecz
- `ApiSuccessResponse<MatchesResponseDTO>` - wrapper

**Constants**:

- `LEAGUE_CODES` - dozwolone kody lig
- `BUSINESS_RULES.MAX_MATCHES_LIMIT` - max 50
- `BUSINESS_RULES.DEFAULT_MATCHES_LIMIT` - default 20
- `BUSINESS_RULES.MATCHES_CACHE_TTL_HOURS` - 1 hour

### 2.4 Szczegóły odpowiedzi

**Success (200 OK)**:

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
      }
    ],
    "cached_at": "2024-01-15T10:00:00Z"
  }
}
```

**Errors**:

- `400 INVALID_LEAGUE`: Nieprawidłowy kod ligi
- `503 EXTERNAL_API_ERROR`: football-data.org niedostępne

### 2.5 Przepływ danych

1. **Endpoint** waliduje query params (Zod schema)
2. **CacheService** sprawdza czy dane są w cache (key: `matches:{league}`)
3. **If cached**: zwróć cached data
4. **If not cached**:
   - **FootballDataService** wywołuje external API
   - Parsuje i transformuje response
   - **CacheService** zapisuje na 1h
   - Zwraca fresh data
5. **Response** zwraca `ApiSuccessResponse<MatchesResponseDTO>`

**Diagram**:

```
Client → Endpoint → Validation → Cache Check
                                     ↓ (miss)
                                FootballDataService → External API
                                     ↓
                                Cache Set (1h TTL) → Response
```

### 2.6 Względy bezpieczeństwa

- **Authentication**: Nie wymagane (publiczny endpoint)
- **Input validation**: Zod schema dla query params
- **API Key protection**: Football-data.org API key w `import.meta.env.FOOTBALL_DATA_API_KEY`
- **Rate limiting**:
  - Cache redukuje calls do external API
  - Opcjonalnie: rate limit per IP (10 requests/minute)
- **CORS**: Skonfiguruj dozwolone origins w production

**Environment variables**:

```env
FOOTBALL_DATA_API_KEY=your_api_key_here
```

### 2.7 Obsługa błędów

| Kod | Error Code         | Scenariusz                         | Akcja                              |
| --- | ------------------ | ---------------------------------- | ---------------------------------- |
| 400 | INVALID_LEAGUE     | league nie jest PL/PD/BL1          | ValidationError z Zod              |
| 400 | INVALID_PARAMETERS | limit poza zakresem 1-50           | ValidationError z Zod              |
| 503 | EXTERNAL_API_ERROR | football-data.org timeout/error    | ExternalServiceError               |
| 503 | EXTERNAL_API_ERROR | football-data.org 429 (rate limit) | ExternalServiceError, wait & retry |
| 500 | INTERNAL_ERROR     | Unexpected error                   | Log + generic error                |

**Retry logic dla External API**:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1))); // exponential backoff
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 2.8 Rozważania dotyczące wydajności

- **Caching strategy**:
  - TTL: 1 hour (mecze rzadko się zmieniają)
  - Cache key: `matches:{league}`
  - Separate cache per league
- **External API optimization**:
  - Cache redukuje calls z ~1000/hour do ~24/day per league
  - Oszczędność: 97.6% reduction w API calls
- **Response size**: ~2-5KB per response (20 matches)
- **Database**: Brak zapytań do DB

**Cache Hit Rate** (estimated):

- First hour after deploy: ~5% (cold cache)
- Steady state: ~95% (users hitting cached data)

### 2.9 Etapy wdrożenia

1. **Stwórz CacheService** (`src/lib/services/cache.service.ts`):

   ```typescript
   export class CacheService {
     private store = new Map<string, CacheEntry<any>>();

     get<T>(key: string): T | null {
       const entry = this.store.get(key);
       if (!entry) return null;

       const now = Date.now();
       if (now - entry.timestamp > entry.ttl) {
         this.store.delete(key);
         return null;
       }

       return entry.data as T;
     }

     set<T>(key: string, data: T, ttl: number): void {
       this.store.set(key, {
         data,
         timestamp: Date.now(),
         ttl,
       });
     }

     clear(key: string): void {
       this.store.delete(key);
     }
   }

   export const cache = new CacheService();
   ```

2. **Stwórz FootballDataService** (`src/lib/services/football-data.service.ts`):

   ```typescript
   import type { MatchDTO } from "@/types";
   import { ExternalServiceError } from "@/lib/errors/api-errors";

   export async function fetchUpcomingMatches(leagueCode: string, limit: number): Promise<MatchDTO[]> {
     const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY;
     if (!apiKey) {
       throw new Error("FOOTBALL_DATA_API_KEY not configured");
     }

     try {
       const response = await fetch(
         `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`,
         {
           headers: {
             "X-Auth-Token": apiKey,
           },
         }
       );

       if (!response.ok) {
         throw new ExternalServiceError("Unable to fetch matches at this time");
       }

       const data = await response.json();

       // Transform external API format to our DTO
       const matches: MatchDTO[] = data.matches.slice(0, limit).map((match: any) => ({
         id: match.id.toString(),
         home_team: match.homeTeam.name,
         away_team: match.awayTeam.name,
         match_date: match.utcDate,
         league: leagueCode,
         status: match.status,
       }));

       return matches;
     } catch (error) {
       if (error instanceof ExternalServiceError) throw error;
       throw new ExternalServiceError("Unable to fetch matches at this time");
     }
   }
   ```

3. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

4. **Stwórz endpoint** (`src/pages/api/matches.ts`):

   ```typescript
   export const prerender = false;

   import type { APIRoute } from "astro";
   import { getMatchesQuerySchema } from "@/lib/validation/schemas";
   import { fetchUpcomingMatches } from "@/lib/services/football-data.service";
   import { cache } from "@/lib/services/cache.service";
   import { formatError } from "@/lib/errors/formatter";
   import { BUSINESS_RULES } from "@/types";

   export const GET: APIRoute = async ({ request }) => {
     try {
       // Parse and validate query params
       const url = new URL(request.url);
       const queryParams = {
         league: url.searchParams.get("league"),
         limit: url.searchParams.get("limit"),
       };

       const { league, limit } = getMatchesQuerySchema.parse(queryParams);

       // Check cache
       const cacheKey = `matches:${league}`;
       const cached = cache.get<any>(cacheKey);

       if (cached) {
         return new Response(JSON.stringify({ data: cached }), {
           status: 200,
           headers: { "Content-Type": "application/json" },
         });
       }

       // Fetch from external API
       const matches = await fetchUpcomingMatches(league, limit);

       // Prepare response
       const responseData = {
         league,
         matches,
         cached_at: new Date().toISOString(),
       };

       // Cache for 1 hour
       const ttl = BUSINESS_RULES.MATCHES_CACHE_TTL_HOURS * 60 * 60 * 1000;
       cache.set(cacheKey, responseData, ttl);

       return new Response(JSON.stringify({ data: responseData }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

5. **Dodaj environment variable** do `.env`

6. **Testuj endpoint**:
   - Test z valid league → 200 OK
   - Test z invalid league → 400 INVALID_LEAGUE
   - Test z limit > 50 → 400 INVALID_PARAMETERS
   - Test cache hit (call dwukrotnie) → drugi request fast
   - Test gdy external API down → 503 EXTERNAL_API_ERROR

---

## Endpoint 3: POST /api/predictions/generate

### 3.1 Przegląd punktu końcowego

Endpoint generuje predykcję AI dla meczu. Wywołuje OpenRouter.ai API z kontekstem meczu i zwraca prawdopodobieństwa wyniku (home/draw/away). Endpoint jest publiczny i cache'uje wyniki na 6 godzin.

### 3.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/predictions/generate`
- **Parametry**:
  - **Wymagane** (body):
    - `match_id`: string - identyfikator meczu
    - `home_team`: string - nazwa drużyny gospodarzy
    - `away_team`: string - nazwa drużyny gości
    - `league`: string - nazwa ligi (Premier League | La Liga | Bundesliga)
    - `match_date`: string - ISO 8601 timestamp
  - **Opcjonalne**: Brak
- **Request Body**:

```json
{
  "match_id": "match_12345",
  "home_team": "Arsenal FC",
  "away_team": "Chelsea FC",
  "league": "Premier League",
  "match_date": "2024-01-20T15:00:00Z"
}
```

- **Authentication**: Optional (publiczny endpoint)

### 3.3 Wykorzystywane typy

**DTOs**:

- `GeneratePredictionRequestDTO` - request body
- `GeneratePredictionResponseDTO` - response
- `PredictionProbabilities` - struktura prawdopodobieństw
- `ApiSuccessResponse<GeneratePredictionResponseDTO>` - wrapper

**Type guards**:

- `isPredictionProbabilities()` - walidacja AI response

**Constants**:

- `LEAGUE_NAMES` - dozwolone nazwy lig
- `BUSINESS_RULES.PREDICTION_CACHE_TTL_HOURS` - 6 hours

### 3.4 Szczegóły odpowiedzi

**Success (200 OK)**:

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

**Errors**:

- `400 INVALID_REQUEST`: Nieprawidłowe dane wejściowe (Zod validation)
- `503 AI_SERVICE_ERROR`: OpenRouter.ai niedostępne lub invalid response

### 3.5 Przepływ danych

1. **Endpoint** waliduje request body (Zod schema)
2. **CacheService** sprawdza cache (key: `prediction:{match_id}`)
3. **If cached**: zwróć cached prediction
4. **If not cached**:
   - **AIPredictionService** wywołuje OpenRouter.ai API
   - Konstruuje prompt z match context
   - Parsuje AI response i waliduje probabilities
   - **CacheService** zapisuje na 6h
   - Zwraca prediction
5. **Response** zwraca `ApiSuccessResponse<GeneratePredictionResponseDTO>`

**Diagram**:

```
Client → Endpoint → Validation → Cache Check
                                     ↓ (miss)
                              AIPredictionService → OpenRouter.ai API
                                     ↓
                              Parse & Validate Response
                                     ↓
                              Cache Set (6h TTL) → Response
```

### 3.6 Względy bezpieczeństwa

- **Authentication**: Nie wymagane (publiczny endpoint)
- **Input validation**:
  - Zod schema dla request body
  - Sanityzacja team names (zapobieganie prompt injection)
- **API Key protection**: OpenRouter.ai API key w `import.meta.env.OPENROUTER_API_KEY`
- **Rate limiting**:
  - Cache redukuje expensive AI calls
  - Opcjonalnie: rate limit per IP (5 requests/minute)
  - Monitor costs (AI calls są drogie)
- **Prompt injection prevention**:
  - Sanityzuj team names przed wstawieniem do promptu
  - Use structured output format od AI

**Environment variables**:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

**Prompt sanitization**:

```typescript
function sanitizeInput(input: string): string {
  // Remove potential injection attempts
  return input
    .replace(/[<>{}]/g, "") // Remove brackets
    .replace(/\n/g, " ") // Remove newlines
    .trim()
    .slice(0, 100); // Limit length
}
```

### 3.7 Obsługa błędów

| Kod | Error Code       | Scenariusz                     | Akcja                                     |
| --- | ---------------- | ------------------------------ | ----------------------------------------- |
| 400 | INVALID_REQUEST  | Nieprawidłowy request body     | ValidationError z Zod                     |
| 400 | INVALID_REQUEST  | league nie jest dozwolone      | ValidationError z Zod                     |
| 400 | INVALID_REQUEST  | match_date nie jest ISO 8601   | ValidationError z Zod                     |
| 503 | AI_SERVICE_ERROR | OpenRouter.ai timeout/error    | ExternalServiceError                      |
| 503 | AI_SERVICE_ERROR | OpenRouter.ai 429 (rate limit) | ExternalServiceError, exponential backoff |
| 503 | AI_SERVICE_ERROR | AI response invalid format     | ExternalServiceError                      |
| 500 | INTERNAL_ERROR   | Unexpected error               | Log + generic error                       |

**AI Response Validation**:

```typescript
function validateAIResponse(response: any): PredictionProbabilities {
  // Extract probabilities from AI response
  const prediction = parseAIResponse(response);

  // Validate using type guard
  if (!isPredictionProbabilities(prediction)) {
    throw new ExternalServiceError("Invalid AI prediction format");
  }

  return prediction;
}
```

### 3.8 Rozważania dotyczące wydajności

- **Caching strategy**:
  - TTL: 6 hours (predykcje mogą się zmieniać gdy zbliża się mecz)
  - Cache key: `prediction:{match_id}`
  - Separate cache per match
- **AI API optimization**:
  - Cache redukuje costly AI calls
  - Oszczędność: ~95% reduction w AI API costs
  - Estimated cost per call: $0.001-0.01
  - Without cache: $10-100/day per 1000 users
  - With cache: $0.50-5/day per 1000 users
- **Response time**:
  - With cache: ~50ms
  - Without cache: ~2-5s (AI inference time)
- **Model selection**:
  - Balance cost vs accuracy
  - MVP: meta-llama/llama-3.1-70b-instruct (good balance)
  - Production: monitor accuracy, adjust model

### 3.9 Etapy wdrożenia

1. **Stwórz AIPredictionService** (`src/lib/services/ai-prediction.service.ts`):

   ```typescript
   import type { GeneratePredictionRequestDTO, PredictionProbabilities } from '@/types'
   import { isPredictionProbabilities } from '@/types'
   import { ExternalServiceError } from '@/lib/errors/api-errors'

   function sanitizeInput(input: string): string {
     return input
       .replace(/[<>{}]/g, '')
       .replace(/\n/g, ' ')
       .trim()
       .slice(0, 100)
   }

   export async function generatePrediction(
     matchData: GeneratePredictionRequestDTO
   ): Promise<PredictionProbabilities> {
     const apiKey = import.meta.env.OPENROUTER_API_KEY
     const model = import.meta.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct'

     if (!apiKey) {
       throw new Error('OPENROUTER_API_KEY not configured')
     }

     // Sanitize inputs
     const homeTeam = sanitizeInput(matchData.home_team)
     const awayTeam = sanitizeInput(matchData.away_team)
     const league = sanitizeInput(matchData.league)

     const systemPrompt = `You are a football match prediction expert. Analyze matches and provide win probabilities.
   Always respond with ONLY a JSON object in this exact format:
   {"home": 0.XX, "draw": 0.XX, "away": 0.XX}
   The three probabilities must sum to 1.0.`

     const userPrompt = `Predict the outcome for this match:
   League: ${league}
   Home Team: ${homeTeam}
   Away Team: ${awayTeam}
   Match Date: ${matchData.match_date}
   ```

Provide probabilities for home win, draw, and away win.`

     try {
       const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           model,
           messages: [
             { role: 'system', content: systemPrompt },
             { role: 'user', content: userPrompt },
           ],
           temperature: 0.7,
           max_tokens: 100,
         }),
       })

       if (!response.ok) {
         throw new ExternalServiceError('Unable to generate prediction at this time')
       }

       const data = await response.json()
       const content = data.choices[0]?.message?.content

       if (!content) {
         throw new ExternalServiceError('Invalid AI response format')
       }

       // Parse JSON from AI response
       const prediction = JSON.parse(content.trim())

       // Validate prediction
       if (!isPredictionProbabilities(prediction)) {
         throw new ExternalServiceError('Invalid prediction probabilities')
       }

       return prediction
     } catch (error) {
       if (error instanceof ExternalServiceError) throw error
       if (error instanceof SyntaxError) {
         throw new ExternalServiceError('Failed to parse AI response')
       }
       throw new ExternalServiceError('Unable to generate prediction at this time')
     }

}

````

2. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

3. **Stwórz endpoint** (`src/pages/api/predictions/generate.ts`):
```typescript
export const prerender = false

import type { APIRoute } from 'astro'
import { generatePredictionBodySchema } from '@/lib/validation/schemas'
import { generatePrediction } from '@/lib/services/ai-prediction.service'
import { cache } from '@/lib/services/cache.service'
import { formatError } from '@/lib/errors/formatter'
import { BUSINESS_RULES } from '@/types'

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate body
    const body = await request.json()
    const matchData = generatePredictionBodySchema.parse(body)

    // Check cache
    const cacheKey = `prediction:${matchData.match_id}`
    const cached = cache.get<any>(cacheKey)

    if (cached) {
      return new Response(JSON.stringify({ data: cached }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate prediction
    const prediction = await generatePrediction(matchData)

    // Prepare response
    const responseData = {
      ...matchData,
      prediction,
      generated_at: new Date().toISOString(),
    }

    // Cache for 6 hours
    const ttl = BUSINESS_RULES.PREDICTION_CACHE_TTL_HOURS * 60 * 60 * 1000
    cache.set(cacheKey, responseData, ttl)

    return new Response(JSON.stringify({ data: responseData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const { status, body } = formatError(error)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
````

4. **Dodaj environment variables** do `.env`

5. **Testuj endpoint**:
   - Test z valid body → 200 OK z prediction
   - Test z invalid league → 400 INVALID_REQUEST
   - Test z invalid match_date → 400 INVALID_REQUEST
   - Test cache hit (call dwukrotnie z tym samym match_id) → drugi request fast
   - Test gdy OpenRouter.ai down → 503 AI_SERVICE_ERROR
   - **Manual verification**: sprawdź czy probabilities sumują się do ~1.0

---

## Endpoint 4: POST /api/predictions

### 4.1 Przegląd punktu końcowego

Endpoint zapisuje wygenerowaną predykcję do listy "Obserwowanych meczów" użytkownika. Wymaga autentykacji i sprawdza limit 50 predykcji na użytkownika.

### 4.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/predictions`
- **Parametry**:
  - **Wymagane** (body):
    - `league`: string - nazwa ligi
    - `match_date`: string - ISO 8601 timestamp
    - `home_team`: string - nazwa gospodarzy
    - `away_team`: string - nazwa gości
    - `prediction_result`: PredictionProbabilities - obiekt z home/draw/away
  - **Opcjonalne** (body):
    - `note`: string - notatka (max 500 chars)
  - **Automatyczne**:
    - `user_id`: pobierany z `context.locals.user.id`
- **Request Body**:

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
  "note": "High confidence in home win based on recent form"
}
```

- **Authentication**: Required

### 4.3 Wykorzystywane typy

**DTOs**:

- `CreatePredictionDTO` - request body (bez user_id, id, created_at)
- `PredictionDTO` - response (pełny obiekt z DB)
- `ApiSuccessResponse<PredictionDTO>` - wrapper

**Constants**:

- `BUSINESS_RULES.MAX_PREDICTIONS_PER_USER` - 50
- `BUSINESS_RULES.MAX_NOTE_LENGTH` - 500

### 4.4 Szczegóły odpowiedzi

**Success (201 Created)**:

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
    "note": "High confidence in home win based on recent form",
    "home_score": null,
    "away_score": null
  }
}
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `400 VALIDATION_ERROR`: Nieprawidłowe dane (Zod validation)
- `403 PREDICTION_LIMIT_REACHED`: Osiągnięto limit 50 predykcji

### 4.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje request body (Zod schema)
4. **PredictionService.checkLimit()** sprawdza czy user ma < 50 predykcji
5. **If limit reached**: throw PredictionLimitError (403)
6. **PredictionService.create()** zapisuje do DB:
   - Ustawia `user_id` z session (NIGDY z body)
   - Ustawia `home_score` i `away_score` na null
   - `id` i `created_at` auto-generated przez DB
7. **RLS** zapewnia, że insert działa tylko dla własnego user_id
8. **Response** zwraca `ApiSuccessResponse<PredictionDTO>` z status 201

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation → Check Limit
                                                          ↓
                                                    PredictionService.create()
                                                          ↓
                                                    Supabase Insert (RLS)
                                                          ↓
                                                    Response (201)
```

### 4.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**:
  - `user_id` ZAWSZE z session, NIGDY z request body
  - RLS policy zapewnia insert tylko dla `auth.uid() = user_id`
- **Input validation**:
  - Zod schema dla wszystkich pól
  - Sanityzacja `note` przed zapisem (XSS prevention)
  - Walidacja `prediction_result` (suma ~1.0)
- **Business logic**:
  - Limit 50 predykcji enforced na poziomie aplikacji
- **Data integrity**:
  - `home_score` i `away_score` zawsze null przy tworzeniu
  - Immutable fields po utworzeniu (poza note)

**RLS Policy** (do stworzenia w migracji):

```sql
CREATE POLICY "Users can insert their own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**XSS Prevention**:

```typescript
function sanitizeNote(note: string | undefined): string | null {
  if (!note) return null;
  // Basic HTML escaping
  return note.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}
```

### 4.7 Obsługa błędów

| Kod | Error Code               | Scenariusz                      | Akcja                        |
| --- | ------------------------ | ------------------------------- | ---------------------------- |
| 401 | UNAUTHORIZED             | Brak tokena/nieprawidłowy token | UnauthorizedError            |
| 400 | VALIDATION_ERROR         | Nieprawidłowy request body      | ValidationError z Zod        |
| 400 | VALIDATION_ERROR         | prediction_result suma != 1.0   | ValidationError z Zod refine |
| 400 | VALIDATION_ERROR         | note > 500 chars                | ValidationError z Zod        |
| 403 | PREDICTION_LIMIT_REACHED | User ma już 50 predykcji        | PredictionLimitError         |
| 500 | INTERNAL_ERROR           | DB error                        | Log + generic error          |

**Limit check implementation**:

```typescript
async function checkPredictionLimit(supabase: SupabaseClient, userId: string): Promise<void> {
  const { count, error } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  if (count && count >= BUSINESS_RULES.MAX_PREDICTIONS_PER_USER) {
    throw new PredictionLimitError();
  }
}
```

### 4.8 Rozważania dotyczące wydajności

- **Database operations**:
  - Count query: ~10-50ms (indexed on user_id)
  - Insert query: ~10-30ms
  - Total: ~50-100ms
- **Index optimization**:
  - Index na `predictions.user_id` przyspiesza count query
  - Primary key index na `id` (auto)
- **No caching needed**: Write operations nie benefitują z cache
- **Response size**: ~500 bytes

**Database indexes** (już zaplanowane w db-plan):

```sql
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
```

### 4.9 Etapy wdrożenia

1. **Stwórz PredictionService** (`src/lib/services/prediction.service.ts`):

   ```typescript
   import type { SupabaseClient } from "@/db/supabase.client";
   import type { CreatePredictionDTO, PredictionDTO } from "@/types";
   import { BUSINESS_RULES } from "@/types";
   import { PredictionLimitError } from "@/lib/errors/api-errors";

   export async function checkPredictionLimit(supabase: SupabaseClient, userId: string): Promise<void> {
     const { count, error } = await supabase
       .from("predictions")
       .select("*", { count: "exact", head: true })
       .eq("user_id", userId);

     if (error) throw error;

     if (count && count >= BUSINESS_RULES.MAX_PREDICTIONS_PER_USER) {
       throw new PredictionLimitError();
     }
   }

   function sanitizeNote(note: string | undefined): string | null {
     if (!note) return null;
     return note.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
   }

   export async function createPrediction(
     supabase: SupabaseClient,
     userId: string,
     data: CreatePredictionDTO
   ): Promise<PredictionDTO> {
     // Prepare data for insert
     const insertData = {
       user_id: userId, // ALWAYS from session
       league: data.league,
       match_date: data.match_date,
       home_team: data.home_team,
       away_team: data.away_team,
       prediction_result: data.prediction_result as any, // Cast to Json type
       note: sanitizeNote(data.note),
       home_score: null,
       away_score: null,
     };

     const { data: prediction, error } = await supabase.from("predictions").insert(insertData).select().single();

     if (error) throw error;

     return prediction as PredictionDTO;
   }
   ```

2. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

3. **Stwórz endpoint** (`src/pages/api/predictions/index.ts`):

   ```typescript
   export const prerender = false;

   import type { APIRoute } from "astro";
   import { createPredictionBodySchema } from "@/lib/validation/schemas";
   import { createPrediction, checkPredictionLimit } from "@/lib/services/prediction.service";
   import { UnauthorizedError } from "@/lib/errors/api-errors";
   import { formatError } from "@/lib/errors/formatter";

   export const POST: APIRoute = async ({ locals, request }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Parse and validate body
       const body = await request.json();
       const data = createPredictionBodySchema.parse(body);

       // Check prediction limit
       await checkPredictionLimit(locals.supabase, locals.user.id);

       // Create prediction
       const prediction = await createPrediction(locals.supabase, locals.user.id, data);

       return new Response(JSON.stringify({ data: prediction }), {
         status: 201,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

4. **Stwórz RLS policy** w nowej migracji Supabase

5. **Stwórz index** na `predictions.user_id` (jeśli nie istnieje)

6. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z valid data → 201 Created
   - Test z invalid prediction_result → 400 VALIDATION_ERROR
   - Test z note > 500 chars → 400 VALIDATION_ERROR
   - Test gdy user ma 50 predykcji → 403 PREDICTION_LIMIT_REACHED
   - **Verify**: user_id w response = user_id z tokena
   - **Verify**: home_score i away_score są null

---

## Endpoint 5: GET /api/predictions

### 5.1 Przegląd punktu końcowego

Endpoint zwraca paginowaną listę wszystkich zapisanych predykcji zalogowanego użytkownika. Wspiera sorting, filtering i pagination.

### 5.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/predictions?limit={n}&offset={n}&sort={field}&order={asc|desc}&league={name}`
- **Parametry**:
  - **Opcjonalne** (query):
    - `limit`: number (1-50, default: 20) - liczba wyników na stronę
    - `offset`: number (≥0, default: 0) - liczba pominiętych wyników
    - `sort`: string (created_at | match_date, default: created_at) - pole sortowania
    - `order`: string (asc | desc, default: desc) - kierunek sortowania
    - `league`: string - filtr po nazwie ligi
- **Request Body**: Brak
- **Authentication**: Required

### 5.3 Wykorzystywane typy

**DTOs**:

- `GetPredictionsQueryParams` - query parameters
- `PaginatedPredictionsResponseDTO` - response wrapper
- `PredictionDTO[]` - lista predykcji
- `PaginationMetadata` - metadane paginacji
- `ApiSuccessResponse<PaginatedPredictionsResponseDTO>` - wrapper

**Constants**:

- `BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT` - 20
- `BUSINESS_RULES.MAX_MATCHES_LIMIT` - 50

### 5.4 Szczegóły odpowiedzi

**Success (200 OK)**:

```json
{
  "data": {
    "predictions": [
      {
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
        "note": "High confidence in home win",
        "home_score": null,
        "away_score": null
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

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `400 INVALID_PARAMETERS`: Nieprawidłowe query params

### 5.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje query params (Zod schema)
4. **PredictionService.getPredictions()** wykonuje dwa zapytania:
   - Count query (dla `pagination.total`)
   - Select query z filters, sorting, pagination
5. **RLS** automatycznie filtruje tylko predykcje użytkownika
6. **Service** oblicza `has_more` = (total > offset + limit)
7. **Response** zwraca `ApiSuccessResponse<PaginatedPredictionsResponseDTO>`

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation
                                          ↓
                                   PredictionService
                                          ↓
                          Count Query (total) | Select Query (data)
                                          ↓
                                   Supabase (RLS filters by user_id)
                                          ↓
                                   Build Pagination Metadata
                                          ↓
                                   Response (200)
```

### 5.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**: RLS policy automatycznie filtruje predykcje użytkownika
- **Input validation**:
  - Zod schema dla query params
  - Whitelist dla `sort` field (tylko created_at, match_date)
  - Whitelist dla `order` (tylko asc, desc)
- **SQL Injection prevention**:
  - Supabase SDK używa parameterized queries
  - League filter escaped przez Supabase
- **Data exposure**: RLS zapewnia, że user widzi tylko swoje predykcje

**RLS Policy** (do stworzenia w migracji):

```sql
CREATE POLICY "Users can view their own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);
```

### 5.7 Obsługa błędów

| Kod | Error Code         | Scenariusz                          | Akcja                 |
| --- | ------------------ | ----------------------------------- | --------------------- |
| 401 | UNAUTHORIZED       | Brak tokena/nieprawidłowy token     | UnauthorizedError     |
| 400 | INVALID_PARAMETERS | limit poza zakresem 1-50            | ValidationError z Zod |
| 400 | INVALID_PARAMETERS | offset < 0                          | ValidationError z Zod |
| 400 | INVALID_PARAMETERS | sort nie jest created_at/match_date | ValidationError z Zod |
| 400 | INVALID_PARAMETERS | order nie jest asc/desc             | ValidationError z Zod |
| 500 | INTERNAL_ERROR     | DB error                            | Log + generic error   |

### 5.8 Rozważania dotyczące wydajności

- **Database optimization**:
  - Index na `predictions.user_id` - przyspiesza WHERE clause
  - Composite index na `(user_id, created_at)` - przyspiesza sorting
  - Composite index na `(user_id, match_date)` - alternatywny sorting
- **Query performance**:
  - Count query: ~10-30ms (indexed)
  - Select query: ~20-50ms (indexed, limited rows)
  - Total: ~50-100ms
- **Pagination**:
  - Limit max 50 prevents large payloads
  - Offset-based pagination (wystarczające dla MVP)
  - Consider cursor-based pagination dla scale
- **Response size**: ~10-25KB (20 predictions x ~500 bytes each)

**Recommended indexes** (dodać do migracji):

```sql
-- Already planned
CREATE INDEX idx_predictions_user_id ON predictions(user_id);

-- Additional for sorting performance
CREATE INDEX idx_predictions_user_created ON predictions(user_id, created_at DESC);
CREATE INDEX idx_predictions_user_match_date ON predictions(user_id, match_date DESC);
```

### 5.9 Etapy wdrożenia

1. **Rozszerz PredictionService** (dodaj do `src/lib/services/prediction.service.ts`):

   ```typescript
   import type { GetPredictionsQueryParams, PaginatedPredictionsResponseDTO } from "@/types";

   export async function getPredictions(
     supabase: SupabaseClient,
     userId: string,
     params: GetPredictionsQueryParams
   ): Promise<PaginatedPredictionsResponseDTO> {
     // Build base query
     let query = supabase.from("predictions").select("*", { count: "exact" }).eq("user_id", userId);

     // Apply league filter if provided
     if (params.league) {
       query = query.eq("league", params.league);
     }

     // Apply sorting
     const sortField = params.sort || "created_at";
     const sortOrder = params.order || "desc";
     query = query.order(sortField, { ascending: sortOrder === "asc" });

     // Apply pagination
     const limit = params.limit || BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT;
     const offset = params.offset || 0;
     query = query.range(offset, offset + limit - 1);

     // Execute query
     const { data, count, error } = await query;

     if (error) throw error;

     // Build pagination metadata
     const total = count || 0;
     const hasMore = total > offset + limit;

     return {
       predictions: (data || []) as PredictionDTO[],
       pagination: {
         total,
         limit,
         offset,
         has_more: hasMore,
       },
     };
   }
   ```

2. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

3. **Rozszerz endpoint** (w `src/pages/api/predictions/index.ts`):

   ```typescript
   import { getPredictionsQuerySchema } from "@/lib/validation/schemas";
   import { getPredictions } from "@/lib/services/prediction.service";

   export const GET: APIRoute = async ({ locals, request }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Parse and validate query params
       const url = new URL(request.url);
       const queryParams = {
         limit: url.searchParams.get("limit"),
         offset: url.searchParams.get("offset"),
         sort: url.searchParams.get("sort"),
         order: url.searchParams.get("order"),
         league: url.searchParams.get("league"),
       };

       const params = getPredictionsQuerySchema.parse(queryParams);

       // Fetch predictions
       const result = await getPredictions(locals.supabase, locals.user.id, params);

       return new Response(JSON.stringify({ data: result }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

4. **Stwórz RLS policy** w migracji Supabase

5. **Stwórz composite indexes** w migracji (jeśli nie istnieją)

6. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z defaults → 200 OK, 20 items, sorted by created_at desc
   - Test z limit=10 → 200 OK, 10 items
   - Test z offset=20 → 200 OK, items 21-40
   - Test z sort=match_date&order=asc → 200 OK, sorted correctly
   - Test z league="Premier League" → 200 OK, only PL matches
   - Test z invalid limit → 400 INVALID_PARAMETERS
   - **Verify**: pagination.has_more correct
   - **Verify**: pagination.total matches actual count

---

## Endpoint 6: GET /api/predictions/:id

### 6.1 Przegląd punktu końcowego

Endpoint zwraca szczegóły pojedynczej predykcji po ID. Wymaga autentykacji i RLS zapewnia dostęp tylko do własnych predykcji.

### 6.2 Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/predictions/{id}`
- **Parametry**:
  - **Wymagane** (path):
    - `id`: integer - ID predykcji
  - **Automatyczne**:
    - `user_id`: z `context.locals.user.id`
- **Request Body**: Brak
- **Authentication**: Required

### 6.3 Wykorzystywane typy

**DTOs**:

- `PredictionDTO` - response (pełny obiekt)
- `ApiSuccessResponse<PredictionDTO>` - wrapper

**Validation**:

- `predictionIdParamSchema` - walidacja path param

### 6.4 Szczegóły odpowiedzi

**Success (200 OK)**:

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
    "note": "High confidence in home win",
    "home_score": null,
    "away_score": null
  }
}
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `404 PREDICTION_NOT_FOUND`: Predykcja nie istnieje lub nie należy do użytkownika

### 6.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje path param `id` (Zod schema)
4. **PredictionService.getPredictionById()** wykonuje SELECT WHERE id = ? AND user_id = ?
5. **RLS** automatycznie filtruje tylko predykcje użytkownika
6. **If not found**: throw NotFoundError (404)
7. **Response** zwraca `ApiSuccessResponse<PredictionDTO>`

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation
                                          ↓
                                   PredictionService.getPredictionById()
                                          ↓
                                   Supabase SELECT (RLS filters)
                                          ↓
                                   Found? → Response (200) : Error (404)
```

### 6.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**:
  - RLS policy automatycznie filtruje predykcje użytkownika
  - Additional check w query: `.eq('user_id', userId)`
- **Input validation**:
  - Zod schema dla path param (musi być positive integer)
- **Information disclosure**:
  - 404 dla nie znalezionej predykcji (nie ujawniamy czy istnieje u innego użytkownika)

**RLS Policy** (ta sama co dla GET /api/predictions):

```sql
CREATE POLICY "Users can view their own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);
```

### 6.7 Obsługa błędów

| Kod | Error Code           | Scenariusz                                   | Akcja                              |
| --- | -------------------- | -------------------------------------------- | ---------------------------------- |
| 401 | UNAUTHORIZED         | Brak tokena/nieprawidłowy token              | UnauthorizedError                  |
| 404 | PREDICTION_NOT_FOUND | ID nie istnieje                              | NotFoundError                      |
| 404 | PREDICTION_NOT_FOUND | ID istnieje ale należy do innego użytkownika | NotFoundError (nie ujawniamy tego) |
| 400 | VALIDATION_ERROR     | ID nie jest valid integer                    | ValidationError z Zod              |
| 500 | INTERNAL_ERROR       | DB error                                     | Log + generic error                |

### 6.8 Rozważania dotyczące wydajności

- **Database query**: SELECT by primary key + user_id (bardzo szybki)
- **Query time**: ~5-15ms
- **Index**: Primary key index na `id` (auto)
- **Response size**: ~500 bytes
- **Caching**: Nie wymagane (prosty query, mały payload)

### 6.9 Etapy wdrożenia

1. **Rozszerz PredictionService** (dodaj do `src/lib/services/prediction.service.ts`):

   ```typescript
   export async function getPredictionById(
     supabase: SupabaseClient,
     userId: string,
     predictionId: number
   ): Promise<PredictionDTO | null> {
     const { data, error } = await supabase
       .from("predictions")
       .select("*")
       .eq("id", predictionId)
       .eq("user_id", userId) // Additional security check
       .single();

     if (error) {
       // Not found error
       if (error.code === "PGRST116") return null;
       throw error;
     }

     return data as PredictionDTO;
   }
   ```

2. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

3. **Stwórz endpoint** (`src/pages/api/predictions/[id]/index.ts`):

   ```typescript
   export const prerender = false;

   import type { APIRoute } from "astro";
   import { predictionIdParamSchema } from "@/lib/validation/schemas";
   import { getPredictionById } from "@/lib/services/prediction.service";
   import { UnauthorizedError, NotFoundError } from "@/lib/errors/api-errors";
   import { formatError } from "@/lib/errors/formatter";

   export const GET: APIRoute = async ({ locals, params }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Validate path param
       const { id } = predictionIdParamSchema.parse(params);

       // Fetch prediction
       const prediction = await getPredictionById(locals.supabase, locals.user.id, id);

       if (!prediction) {
         throw new NotFoundError("PREDICTION_NOT_FOUND", "Prediction not found");
       }

       return new Response(JSON.stringify({ data: prediction }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

4. **RLS policy już istnieje** (ta sama co dla GET /api/predictions)

5. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z valid ID (own prediction) → 200 OK
   - Test z non-existent ID → 404 PREDICTION_NOT_FOUND
   - Test z ID należącym do innego usera → 404 PREDICTION_NOT_FOUND
   - Test z invalid ID (string) → 400 VALIDATION_ERROR

---

## Endpoint 7: PATCH /api/predictions/:id

### 7.1 Przegląd punktu końcowego

Endpoint aktualizuje TYLKO pole `note` w predykcji. Wszystkie inne pola są immutable. Wymaga autentykacji.

### 7.2 Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/predictions/{id}`
- **Parametry**:
  - **Wymagane** (path):
    - `id`: integer - ID predykcji
  - **Wymagane** (body):
    - `note`: string | null - notatka (max 500 chars, może być null żeby wyczyścić)
  - **Automatyczne**:
    - `user_id`: z `context.locals.user.id`
- **Request Body**:

```json
{
  "note": "Updated analysis after checking team news"
}
```

- **Authentication**: Required

### 7.3 Wykorzystywane typy

**DTOs**:

- `UpdatePredictionDTO` - request body (tylko note)
- `PredictionDTO` - response (pełny obiekt po update)
- `ApiSuccessResponse<PredictionDTO>` - wrapper

**Constants**:

- `BUSINESS_RULES.MAX_NOTE_LENGTH` - 500

### 7.4 Szczegóły odpowiedzi

**Success (200 OK)**:

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
    "note": "Updated analysis after checking team news",
    "home_score": null,
    "away_score": null
  }
}
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `404 PREDICTION_NOT_FOUND`: Predykcja nie istnieje lub nie należy do użytkownika
- `400 VALIDATION_ERROR`: note za długie (> 500 chars)

### 7.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje path param `id` (Zod schema)
4. **Endpoint** waliduje request body (Zod schema)
5. **Sanitize** note (XSS prevention)
6. **PredictionService.updateNote()** wykonuje UPDATE SET note = ? WHERE id = ? AND user_id = ?
7. **RLS** zapewnia update tylko własnych predykcji
8. **If not found** (0 rows updated): throw NotFoundError (404)
9. **Fetch updated prediction** i zwróć w response
10. **Response** zwraca `ApiSuccessResponse<PredictionDTO>`

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation → Sanitize note
                                                          ↓
                                            PredictionService.updateNote()
                                                          ↓
                                            Supabase UPDATE (RLS filters)
                                                          ↓
                                            Affected? → Fetch & Response (200) : Error (404)
```

### 7.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**:
  - RLS policy zapewnia update tylko własnych predykcji
  - Additional check w query: `.eq('user_id', userId)`
- **Immutability enforcement**:
  - Endpoint akceptuje TYLKO pole `note` w body
  - Inne pola są ignorowane nawet jeśli są w body
  - Service wykonuje UPDATE ONLY na `note` field
- **Input validation**:
  - Zod schema dla path param i body
  - Max 500 chars dla note
- **XSS prevention**: Sanityzacja note przed zapisem

**RLS Policy** (do stworzenia w migracji):

```sql
CREATE POLICY "Users can update their own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Immutability test**:

```typescript
// Jeśli user spróbuje zmienić inne pola:
const maliciousBody = {
  note: "Updated note",
  prediction_result: { home: 1.0, draw: 0.0, away: 0.0 }, // Próba zmiany
  home_score: 99, // Próba zmiany
};

// Endpoint MUSI zignorować wszystko poza note
const { note } = updatePredictionBodySchema.parse(maliciousBody);
// note = "Updated note", inne pola nie przechodzą przez schema
```

### 7.7 Obsługa błędów

| Kod | Error Code           | Scenariusz                      | Akcja                 |
| --- | -------------------- | ------------------------------- | --------------------- |
| 401 | UNAUTHORIZED         | Brak tokena/nieprawidłowy token | UnauthorizedError     |
| 404 | PREDICTION_NOT_FOUND | ID nie istnieje                 | NotFoundError         |
| 404 | PREDICTION_NOT_FOUND | ID należy do innego użytkownika | NotFoundError         |
| 400 | VALIDATION_ERROR     | note > 500 chars                | ValidationError z Zod |
| 400 | VALIDATION_ERROR     | ID nie jest valid integer       | ValidationError z Zod |
| 500 | INTERNAL_ERROR       | DB error                        | Log + generic error   |

### 7.8 Rozważania dotyczące wydajności

- **Database operations**:
  - UPDATE query: ~10-20ms (indexed by primary key)
  - SELECT query (fetch updated): ~5-15ms
  - Total: ~20-50ms
- **Index**: Primary key index na `id` (auto)
- **Response size**: ~500 bytes
- **Caching**: Nie wymagane (write operation)

### 7.9 Etapy wdrożenia

1. **Rozszerz PredictionService** (dodaj do `src/lib/services/prediction.service.ts`):

   ```typescript
   export async function updatePredictionNote(
     supabase: SupabaseClient,
     userId: string,
     predictionId: number,
     note: string | null
   ): Promise<PredictionDTO | null> {
     // Sanitize note
     const sanitizedNote = note ? sanitizeNote(note) : null;

     // Update only note field
     const { data, error } = await supabase
       .from("predictions")
       .update({ note: sanitizedNote })
       .eq("id", predictionId)
       .eq("user_id", userId) // Additional security check
       .select()
       .single();

     if (error) {
       // Not found error
       if (error.code === "PGRST116") return null;
       throw error;
     }

     return data as PredictionDTO;
   }
   ```

2. **Stwórz validation schema** (dodaj do `src/lib/validation/schemas.ts`)

3. **Rozszerz endpoint** (`src/pages/api/predictions/[id]/index.ts`):

   ```typescript
   import { updatePredictionBodySchema } from "@/lib/validation/schemas";
   import { updatePredictionNote } from "@/lib/services/prediction.service";

   export const PATCH: APIRoute = async ({ locals, params, request }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Validate path param
       const { id } = predictionIdParamSchema.parse(params);

       // Parse and validate body
       const body = await request.json();
       const { note } = updatePredictionBodySchema.parse(body);

       // Update prediction
       const prediction = await updatePredictionNote(locals.supabase, locals.user.id, id, note || null);

       if (!prediction) {
         throw new NotFoundError("PREDICTION_NOT_FOUND", "Prediction not found");
       }

       return new Response(JSON.stringify({ data: prediction }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

4. **Stwórz RLS policy** w migracji Supabase

5. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z valid note → 200 OK, note updated
   - Test z note=null → 200 OK, note cleared
   - Test z note > 500 chars → 400 VALIDATION_ERROR
   - Test z non-existent ID → 404 PREDICTION_NOT_FOUND
   - Test z ID innego usera → 404 PREDICTION_NOT_FOUND
   - **Critical test**: Spróbuj zmienić inne pola (prediction_result, home_score) → NIE POWINNY się zmienić

---

## Endpoint 8: DELETE /api/predictions/:id

### 8.1 Przegląd punktu końcowego

Endpoint usuwa predykcję. Wymaga autentykacji i RLS zapewnia delete tylko własnych predykcji. Zwraca status 204 No Content przy sukcesie.

### 8.2 Szczegóły żądania

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/predictions/{id}`
- **Parametry**:
  - **Wymagane** (path):
    - `id`: integer - ID predykcji do usunięcia
  - **Automatyczne**:
    - `user_id`: z `context.locals.user.id`
- **Request Body**: Brak
- **Authentication**: Required

### 8.3 Wykorzystywane typy

**Validation**:

- `predictionIdParamSchema` - walidacja path param

**Response**:

- Success: 204 No Content (brak body)
- Error: `ApiErrorResponse`

### 8.4 Szczegóły odpowiedzi

**Success (204 No Content)**:

```
(empty response body)
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `404 PREDICTION_NOT_FOUND`: Predykcja nie istnieje lub nie należy do użytkownika

### 8.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje path param `id` (Zod schema)
4. **PredictionService.deletePrediction()** wykonuje DELETE WHERE id = ? AND user_id = ?
5. **RLS** zapewnia delete tylko własnych predykcji
6. **Check rows affected**: jeśli 0 → throw NotFoundError (404)
7. **Response** zwraca 204 No Content (bez body)

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation
                                          ↓
                                   PredictionService.deletePrediction()
                                          ↓
                                   Supabase DELETE (RLS filters)
                                          ↓
                                   Affected? → Response (204) : Error (404)
```

### 8.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**:
  - RLS policy zapewnia delete tylko własnych predykcji
  - Additional check w query: `.eq('user_id', userId)`
- **Input validation**: Zod schema dla path param (positive integer)
- **Cascade deletes**: Handled automatycznie przez DB (jeśli są foreign keys)

**RLS Policy** (do stworzenia w migracji):

```sql
CREATE POLICY "Users can delete their own predictions"
  ON predictions FOR DELETE
  USING (auth.uid() = user_id);
```

### 8.7 Obsługa błędów

| Kod | Error Code           | Scenariusz                      | Akcja                 |
| --- | -------------------- | ------------------------------- | --------------------- |
| 401 | UNAUTHORIZED         | Brak tokena/nieprawidłowy token | UnauthorizedError     |
| 404 | PREDICTION_NOT_FOUND | ID nie istnieje                 | NotFoundError         |
| 404 | PREDICTION_NOT_FOUND | ID należy do innego użytkownika | NotFoundError         |
| 400 | VALIDATION_ERROR     | ID nie jest valid integer       | ValidationError z Zod |
| 500 | INTERNAL_ERROR       | DB error                        | Log + generic error   |

### 8.8 Rozważania dotyczące wydajności

- **Database query**: DELETE by primary key + user_id (bardzo szybki)
- **Query time**: ~10-20ms
- **Index**: Primary key index na `id` (auto)
- **No response body**: Minimalna wielkość odpowiedzi
- **Side effects**: Brak (no cascade deletes w obecnym schemacie)

### 8.9 Etapy wdrożenia

1. **Rozszerz PredictionService** (dodaj do `src/lib/services/prediction.service.ts`):

   ```typescript
   export async function deletePrediction(
     supabase: SupabaseClient,
     userId: string,
     predictionId: number
   ): Promise<boolean> {
     const { data, error } = await supabase
       .from("predictions")
       .delete()
       .eq("id", predictionId)
       .eq("user_id", userId) // Additional security check
       .select();

     if (error) throw error;

     // Check if any row was deleted
     return data && data.length > 0;
   }
   ```

2. **Rozszerz endpoint** (`src/pages/api/predictions/[id]/index.ts`):

   ```typescript
   import { deletePrediction } from "@/lib/services/prediction.service";

   export const DELETE: APIRoute = async ({ locals, params }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Validate path param
       const { id } = predictionIdParamSchema.parse(params);

       // Delete prediction
       const deleted = await deletePrediction(locals.supabase, locals.user.id, id);

       if (!deleted) {
         throw new NotFoundError("PREDICTION_NOT_FOUND", "Prediction not found");
       }

       // Return 204 No Content
       return new Response(null, { status: 204 });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

3. **Stwórz RLS policy** w migracji Supabase

4. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z valid ID (own prediction) → 204 No Content
   - **Verify**: Prediction faktycznie usunięta z DB
   - Test z non-existent ID → 404 PREDICTION_NOT_FOUND
   - Test z ID innego usera → 404 PREDICTION_NOT_FOUND
   - Test z invalid ID → 400 VALIDATION_ERROR
   - Test ponownego delete tego samego ID → 404 PREDICTION_NOT_FOUND

---

## Endpoint 9: POST /api/predictions/:id/fetch-result

### 9.1 Przegląd punktu końcowego

Endpoint pobiera finalne wyniki zakończonego meczu z football-data.org API i cache'uje je w polach `home_score` i `away_score`. Przy kolejnych wywołaniach zwraca cached wynik bez external API call.

### 9.2 Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/predictions/{id}/fetch-result`
- **Parametry**:
  - **Wymagane** (path):
    - `id`: integer - ID predykcji
  - **Automatyczne**:
    - `user_id`: z `context.locals.user.id`
- **Request Body**: Brak
- **Authentication**: Required

### 9.3 Wykorzystywane typy

**DTOs**:

- `PredictionDTO` - response (z wypełnionymi home_score, away_score)
- `ApiSuccessResponse<PredictionDTO>` - wrapper

**Validation**:

- `predictionIdParamSchema` - walidacja path param

### 9.4 Szczegóły odpowiedzi

**Success (200 OK)**:

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
    "note": "High confidence in home win",
    "home_score": 2,
    "away_score": 1
  }
}
```

**Errors**:

- `401 UNAUTHORIZED`: Użytkownik nie jest zalogowany
- `404 PREDICTION_NOT_FOUND`: Predykcja nie istnieje lub nie należy do użytkownika
- `409 MATCH_NOT_FINISHED`: Mecz jeszcze się nie zakończył
- `503 EXTERNAL_API_ERROR`: football-data.org niedostępne

### 9.5 Przepływ danych

1. **Middleware** waliduje JWT i ustawia `context.locals.user`
2. **Endpoint** sprawdza authentication
3. **Endpoint** waliduje path param `id`
4. **PredictionService.fetchAndCacheResult()** flow:
   - Fetch prediction z DB
   - **If not found**: throw NotFoundError (404)
   - **If scores już cached** (home_score !== null): return prediction (early return)
   - **Check match_date**: jeśli w przyszłości → throw ConflictError (409)
   - **FootballDataService.fetchMatchResult()** call external API
   - Update prediction SET home_score = ?, away_score = ?
   - Return updated prediction
5. **Response** zwraca `ApiSuccessResponse<PredictionDTO>`

**Diagram**:

```
Client → Middleware (JWT) → Endpoint → Validation
                                          ↓
                                   PredictionService.fetchAndCacheResult()
                                          ↓
                                   Fetch prediction from DB
                                          ↓
                          Cached? → Yes: Return cached (200)
                                          ↓ No
                          Match finished? → No: Error (409)
                                          ↓ Yes
                          FootballDataService → External API
                                          ↓
                          Update DB (cache scores)
                                          ↓
                          Response (200)
```

### 9.6 Względy bezpieczeństwa

- **Authentication**: Required - sprawdzenie `context.locals.user`
- **Authorization**: RLS zapewnia dostęp tylko do własnych predykcji
- **Input validation**: Zod schema dla path param
- **Business logic validation**:
  - Sprawdzenie czy mecz się zakończył przed external API call
  - Cache check prevents repeated expensive calls
- **API Key protection**: Football-data.org API key w env variable
- **Rate limiting**: Cache dramatically reduces external API calls

### 9.7 Obsługa błędów

| Kod | Error Code           | Scenariusz                                 | Akcja                |
| --- | -------------------- | ------------------------------------------ | -------------------- |
| 401 | UNAUTHORIZED         | Brak tokena/nieprawidłowy token            | UnauthorizedError    |
| 404 | PREDICTION_NOT_FOUND | ID nie istnieje lub należy do innego usera | NotFoundError        |
| 409 | MATCH_NOT_FINISHED   | match_date jest w przyszłości              | ConflictError        |
| 503 | EXTERNAL_API_ERROR   | football-data.org timeout/error            | ExternalServiceError |
| 503 | EXTERNAL_API_ERROR   | Match nie ma final score w API             | ExternalServiceError |
| 500 | INTERNAL_ERROR       | DB error                                   | Log + generic error  |

**Match finished check**:

```typescript
function isMatchFinished(matchDate: string): boolean {
  const matchTime = new Date(matchDate).getTime();
  const now = Date.now();
  // Match musi być co najmniej 3 godziny w przeszłości (safety buffer)
  const threeHours = 3 * 60 * 60 * 1000;
  return now - matchTime > threeHours;
}
```

### 9.8 Rozważania dotyczące wydajności

- **Caching benefits**:
  - First call: ~2-3s (external API call)
  - Subsequent calls: ~20ms (DB read only)
  - 99%+ reduction w external API calls per match
  - Significant cost savings
- **Database operations**:
  - First SELECT: ~10ms
  - UPDATE (if fetching): ~20ms
  - Total (cached): ~10-20ms
  - Total (not cached): ~2-3s
- **External API**:
  - Rate limit: 10 calls/min (free tier)
  - Cache prevents hitting rate limit
- **User experience**:
  - Instant response dla cached results
  - One-time wait dla fresh fetch

**Cost analysis**:

- Without cache: 1000 users × 50 predictions = 50,000 API calls
- With cache: 50,000 unique matches = 50,000 API calls (but distributed over time)
- With cache + users checking repeatedly: ~50,000 API calls total vs millions without cache

### 9.9 Etapy wdrożenia

1. **Rozszerz FootballDataService** (dodaj do `src/lib/services/football-data.service.ts`):

   ```typescript
   export interface MatchResult {
     home_score: number;
     away_score: number;
   }

   export async function fetchMatchResult(matchId: string): Promise<MatchResult> {
     const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY;
     if (!apiKey) {
       throw new Error("FOOTBALL_DATA_API_KEY not configured");
     }

     try {
       const response = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
         headers: {
           "X-Auth-Token": apiKey,
         },
       });

       if (!response.ok) {
         throw new ExternalServiceError("Unable to fetch match result at this time");
       }

       const data = await response.json();

       // Check if match is finished
       if (data.status !== "FINISHED") {
         throw new ConflictError("MATCH_NOT_FINISHED", "Match result not available yet");
       }

       // Extract scores
       const homeScore = data.score?.fullTime?.home;
       const awayScore = data.score?.fullTime?.away;

       if (homeScore === undefined || homeScore === null || awayScore === undefined || awayScore === null) {
         throw new ExternalServiceError("Match result not available");
       }

       return {
         home_score: homeScore,
         away_score: awayScore,
       };
     } catch (error) {
       if (error instanceof ExternalServiceError || error instanceof ConflictError) {
         throw error;
       }
       throw new ExternalServiceError("Unable to fetch match result at this time");
     }
   }
   ```

2. **Rozszerz PredictionService** (dodaj do `src/lib/services/prediction.service.ts`):

   ```typescript
   import { fetchMatchResult } from "./football-data.service";
   import { ConflictError } from "@/lib/errors/api-errors";

   function isMatchFinished(matchDate: string): boolean {
     const matchTime = new Date(matchDate).getTime();
     const now = Date.now();
     const threeHours = 3 * 60 * 60 * 1000;
     return now - matchTime > threeHours;
   }

   export async function fetchAndCacheResult(
     supabase: SupabaseClient,
     userId: string,
     predictionId: number
   ): Promise<PredictionDTO> {
     // Fetch prediction
     const prediction = await getPredictionById(supabase, userId, predictionId);

     if (!prediction) {
       throw new NotFoundError("PREDICTION_NOT_FOUND", "Prediction not found");
     }

     // Check if already cached
     if (prediction.home_score !== null && prediction.away_score !== null) {
       return prediction; // Early return with cached data
     }

     // Check if match is finished
     if (!isMatchFinished(prediction.match_date)) {
       throw new ConflictError("MATCH_NOT_FINISHED", "Match result not available yet");
     }

     // Extract match_id from prediction (stored in external match data)
     // Note: Wymaga match_id field w predictions table lub extraction z innych danych
     // Dla MVP zakładamy że możemy użyć kombinacji team names do wyszukania
     // W produkcji lepiej dodać match_id do predictions table

     // Fetch result from external API
     // For now, will use a workaround - need match_id in predictions table
     // This is a limitation that should be documented

     // UWAGA: To wymaga rozszerzenia schematu predictions o match_id field
     // Alternatywnie: można użyć search API football-data.org

     throw new Error("Implementation requires match_id field in predictions table");
   }
   ```

3. **Stwórz endpoint** (`src/pages/api/predictions/[id]/fetch-result.ts`):

   ```typescript
   export const prerender = false;

   import type { APIRoute } from "astro";
   import { predictionIdParamSchema } from "@/lib/validation/schemas";
   import { fetchAndCacheResult } from "@/lib/services/prediction.service";
   import { UnauthorizedError } from "@/lib/errors/api-errors";
   import { formatError } from "@/lib/errors/formatter";

   export const POST: APIRoute = async ({ locals, params }) => {
     try {
       // Check authentication
       if (!locals.user) {
         throw new UnauthorizedError();
       }

       // Validate path param
       const { id } = predictionIdParamSchema.parse(params);

       // Fetch and cache result
       const prediction = await fetchAndCacheResult(locals.supabase, locals.user.id, id);

       return new Response(JSON.stringify({ data: prediction }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       const { status, body } = formatError(error);
       return new Response(JSON.stringify(body), {
         status,
         headers: { "Content-Type": "application/json" },
       });
     }
   };
   ```

4. **WAŻNE - Schema extension required**:

   **Problem**: Obecny schemat `predictions` nie zawiera `match_id` potrzebnego do fetch z football-data.org.

   **Rozwiązania**:

   **Opcja A** (Preferowana): Dodaj `match_id` field do predictions table:

   ```sql
   ALTER TABLE predictions ADD COLUMN match_id TEXT;
   ```

   - Update POST /api/predictions endpoint żeby zapisywało match_id
   - Update predictions.generate żeby zwracało match_id który można zapisać

   **Opcja B**: Use search/query API football-data.org żeby znaleźć match po team names + date:
   - Wolniejsze (extra API call)
   - Mniej niezawodne (team names mogą się różnić)
   - Nie wymaga zmiany schematu

   **Rekomendacja**: Użyć Opcji A - dodać `match_id` jako migration.

5. **Testuj endpoint**:
   - Test bez tokena → 401 UNAUTHORIZED
   - Test z finished match (first call) → 200 OK, scores fetched
   - Test z finished match (second call) → 200 OK, cached scores (fast)
   - Test z upcoming match → 409 MATCH_NOT_FINISHED
   - Test z non-existent ID → 404 PREDICTION_NOT_FOUND
   - Test z ID innego usera → 404 PREDICTION_NOT_FOUND
   - Test gdy football-data.org down → 503 EXTERNAL_API_ERROR

---

## Bezpieczeństwo i monitoring

### 10.1 Security Checklist

#### Authentication & Authorization

- [ ] JWT validation w middleware dla wszystkich protected endpoints
- [ ] RLS policies włączone na wszystkich tabelach
- [ ] user_id zawsze z session, nigdy z request body
- [ ] Proper error messages (nie ujawniaj internal details)

#### Input Validation

- [ ] Zod schemas dla wszystkich request inputs (query, body, params)
- [ ] Sanityzacja user-generated content (notes)
- [ ] Type guards dla critical data (prediction_probabilities)
- [ ] Whitelist validation dla enums (league codes, sort fields)

#### API Security

- [ ] External API keys w environment variables
- [ ] HTTPS only w produkcji
- [ ] CORS configuration (whitelist domains)
- [ ] Rate limiting per endpoint (especially expensive ones)
- [ ] Request size limits (prevent DoS)

#### Data Protection

- [ ] XSS prevention (sanitize notes)
- [ ] SQL injection prevention (parameterized queries via Supabase)
- [ ] Prompt injection prevention (sanitize inputs do AI)
- [ ] No sensitive data w logs
- [ ] Proper error masking

#### Infrastructure

- [ ] Environment variables properly secured
- [ ] Database connection pooling
- [ ] Secrets rotation strategy
- [ ] Backup strategy

### 10.2 Rate Limiting Strategy

**Implementation options**:

1. **Simple in-memory** (MVP): Track requests per IP in Map
2. **Redis** (Production): Distributed rate limiting

**Limits**:

```typescript
const RATE_LIMITS = {
  "/api/matches": { requests: 60, window: 60 * 1000 }, // 60/min
  "/api/predictions/generate": { requests: 10, window: 60 * 1000 }, // 10/min (expensive)
  "/api/predictions": { requests: 100, window: 60 * 1000 }, // 100/min
  default: { requests: 100, window: 60 * 1000 },
};
```

**Implementation** w middleware:

```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, endpoint: string): void {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + limit.window });
    return;
  }

  if (entry.count >= limit.requests) {
    throw new ApiError(429, "RATE_LIMIT_EXCEEDED", "Too many requests");
  }

  entry.count++;
}
```

### 10.3 Monitoring & Logging

**Metrics to track**:

```typescript
interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}
```

**Logging levels**:

- **INFO**: All API requests (endpoint, method, user, duration)
- **WARN**: External API failures, cache misses, rate limit hits
- **ERROR**: All errors with stack traces, user context

**Monitoring tools** (dla produkcji):

- **Sentry**: Error tracking and alerting
- **DataDog/New Relic**: Performance monitoring
- **Custom dashboard**: Track:
  - Requests per endpoint
  - Error rates
  - P50, P95, P99 latency
  - Cache hit rates
  - External API success rates
  - Active users

**Health check endpoint** (`/api/health`):

```typescript
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
```

### 10.4 Database Migrations Required

**Create new migration** dla RLS policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Predictions policies
CREATE POLICY "Users can view their own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_created ON predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_user_match_date ON predictions(user_id, match_date DESC);

-- Add match_id column (required for fetch-result endpoint)
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS match_id TEXT;
```

### 10.5 Environment Variables

**Required `.env` file**:

```env
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External APIs
FOOTBALL_DATA_API_KEY=your_football_data_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct

# App Config
NODE_ENV=production
```

### 10.6 Testing Strategy

**Unit tests** (dla services):

- CacheService: set, get, expiration
- PredictionService: wszystkie metody
- FootballDataService: mock external API
- AIPredictionService: mock external API
- Validation schemas: edge cases

**Integration tests** (dla endpoints):

- Każdy endpoint: success cases
- Każdy endpoint: error cases (401, 400, 404, etc.)
- Authentication flow
- RLS enforcement
- Rate limiting

**E2E tests**:

- Full user journey: register → generate prediction → save → list → delete
- Cache behavior
- Limit enforcement (50 predictions)

---

## Podsumowanie

Ten dokument zawiera kompleksowy plan implementacji dla wszystkich 9 endpointów REST API aplikacji PitchPredict AI.

### Priorytety implementacji

**Faza 1 - Core Infrastructure** (Week 1):

1. Setup: Error classes, validation schemas, middleware
2. Services: CacheService, ProfileService
3. Endpoint: GET /api/profile

**Faza 2 - External Integrations** (Week 2): 4. Services: FootballDataService, AIPredictionService 5. Endpoints: GET /api/matches, POST /api/predictions/generate

**Faza 3 - Predictions CRUD** (Week 3): 6. Service: PredictionService (complete) 7. Endpoints: POST /api/predictions, GET /api/predictions, GET /api/predictions/:id

**Faza 4 - Advanced Features** (Week 4): 8. Endpoints: PATCH /api/predictions/:id, DELETE /api/predictions/:id 9. Database migration: Add match_id field 10. Endpoint: POST /api/predictions/:id/fetch-result

**Faza 5 - Security & Polish** (Week 5): 11. RLS policies migration 12. Rate limiting 13. Monitoring & logging 14. Testing (unit, integration, e2e)

### Kluczowe decyzje techniczne

1. **Cache strategy**: In-memory dla MVP, Redis dla scale
2. **Validation**: Zod schemas dla type safety
3. **Error handling**: Custom error classes z standardowym formatem
4. **Security**: RLS + middleware authentication
5. **Performance**: Indexes + caching dla expensive operations

### Wymagane zmiany w schemacie

⚠️ **KRYTYCZNE**: Dodać `match_id` field do `predictions` table dla endpoint 9.

### Następne kroki

1. Review tego planu z zespołem
2. Setup dev environment z .env
3. Rozpocząć implementację według priorytetów
4. Iteracyjne testowanie każdego endpointa
5. Deploy do staging environment
6. E2E testing
7. Production deployment

---

**Dokument wersja**: 1.0
**Data utworzenia**: 2025-10-25
**Autor**: Claude Code (AI Architecture Assistant)
