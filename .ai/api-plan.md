# REST API Plan - PitchPredict AI

## 1. Resources

### Core Resources
| Resource | Database Table | Description |
|----------|---------------|-------------|
| **Profiles** | `public.profiles` | User profile data, 1:1 relationship with `auth.users` |
| **Predictions** | `public.predictions` | User-saved match predictions with denormalized match data |

### External Resources (Proxied)
| Resource | External Source | Description |
|----------|----------------|-------------|
| **Matches** | football-data.org API | Upcoming matches for supported leagues |
| **AI Predictions** | OpenRouter.ai API | AI-generated match outcome probabilities |
| **Match Results** | football-data.org API | Final scores for completed matches |

---

## 2. Endpoints

### 2.1 Profile Endpoints

#### GET `/api/profile`
Get the current authenticated user's profile.

**Authentication**: Required (Bearer token in Authorization header)

**Query Parameters**: None

**Request Body**: None

**Response Success** (200 OK):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `404 Not Found`: Profile does not exist
```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "User profile not found"
  }
}
```

---

### 2.2 Matches Endpoints

#### GET `/api/matches`
Get upcoming matches for a specific league.

**Authentication**: Optional (works for both authenticated and anonymous users)

**Query Parameters**:
| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `league` | string | Yes | League identifier | `PL` (Premier League), `PD` (La Liga), `BL1` (Bundesliga) |
| `limit` | integer | No | Number of matches to return (default: 20, max: 50) | 1-50 |

**Request Body**: None

**Response Success** (200 OK):
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

**Response Errors**:
- `400 Bad Request`: Invalid league parameter
```json
{
  "error": {
    "code": "INVALID_LEAGUE",
    "message": "League must be one of: PL, PD, BL1"
  }
}
```
- `503 Service Unavailable`: External API unavailable
```json
{
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Unable to fetch matches at this time"
  }
}
```

**Caching Strategy**: Results cached for 1 hour to reduce external API calls.

---

### 2.3 AI Prediction Endpoints

#### POST `/api/predictions/generate`
Generate AI prediction for a specific match.

**Authentication**: Optional (works for both authenticated and anonymous users)

**Query Parameters**: None

**Request Body**:
```json
{
  "match_id": "match_12345",
  "home_team": "Arsenal FC",
  "away_team": "Chelsea FC",
  "league": "Premier League",
  "match_date": "2024-01-20T15:00:00Z"
}
```

**Request Validation**:
- `match_id`: required, non-empty string
- `home_team`: required, non-empty string
- `away_team`: required, non-empty string
- `league`: required, one of: "Premier League", "La Liga", "Bundesliga"
- `match_date`: required, valid ISO 8601 timestamp

**Response Success** (200 OK):
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
      "away": 0.20
    },
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response Errors**:
- `400 Bad Request`: Invalid request body
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid match data provided",
    "details": {
      "field": "league",
      "issue": "Must be one of: Premier League, La Liga, Bundesliga"
    }
  }
}
```
- `503 Service Unavailable`: AI service unavailable
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Unable to generate prediction at this time"
  }
}
```

**Caching Strategy**: Results cached by match_id for 6 hours to reduce AI API costs.

---

### 2.4 Saved Predictions Endpoints

#### POST `/api/predictions`
Save a generated prediction to the user's watched list.

**Authentication**: Required

**Query Parameters**: None

**Request Body**:
```json
{
  "league": "Premier League",
  "match_date": "2024-01-20T15:00:00Z",
  "home_team": "Arsenal FC",
  "away_team": "Chelsea FC",
  "prediction_result": {
    "home": 0.52,
    "draw": 0.28,
    "away": 0.20
  },
  "note": "High confidence in home win based on recent form"
}
```

**Request Validation**:
- `league`: required, non-empty string
- `match_date`: required, valid ISO 8601 timestamp
- `home_team`: required, non-empty string
- `away_team`: required, non-empty string
- `prediction_result`: required, object with three numeric values (home, draw, away) that sum to ~1.0
- `note`: optional, max 500 characters

**Response Success** (201 Created):
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
      "away": 0.20
    },
    "note": "High confidence in home win based on recent form",
    "home_score": null,
    "away_score": null
  }
}
```

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `400 Bad Request`: Validation error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid prediction data",
    "details": {
      "field": "note",
      "issue": "Must be 500 characters or less"
    }
  }
}
```
- `403 Forbidden`: Prediction limit reached
```json
{
  "error": {
    "code": "PREDICTION_LIMIT_REACHED",
    "message": "Maximum of 50 saved predictions reached. Please delete some predictions to add new ones."
  }
}
```

**Business Logic**:
- Enforces 50 prediction limit per user
- Automatically sets `user_id` from authenticated session
- Sets `home_score` and `away_score` to null initially

---

#### GET `/api/predictions`
Get all saved predictions for the authenticated user.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `limit` | integer | No | Number of predictions per page (default: 20, max: 50) | 1-50 |
| `offset` | integer | No | Number of predictions to skip (default: 0) | ≥0 |
| `sort` | string | No | Sort field (default: created_at) | `created_at`, `match_date` |
| `order` | string | No | Sort order (default: desc) | `asc`, `desc` |
| `league` | string | No | Filter by league | Any league name |

**Request Body**: None

**Response Success** (200 OK):
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
          "away": 0.20
        },
        "note": "High confidence in home win",
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
          "draw": 0.30,
          "away": 0.25
        },
        "note": "El Clásico - could go either way",
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

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `400 Bad Request`: Invalid query parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid query parameters",
    "details": {
      "field": "limit",
      "issue": "Must be between 1 and 50"
    }
  }
}
```

**Business Logic**:
- Returns only predictions belonging to authenticated user (enforced by RLS)
- Default sort: newest first (created_at desc)
- Includes pagination metadata

---

#### GET `/api/predictions/:id`
Get a specific saved prediction by ID.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Prediction ID |

**Query Parameters**: None

**Request Body**: None

**Response Success** (200 OK):
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
      "away": 0.20
    },
    "note": "High confidence in home win",
    "home_score": null,
    "away_score": null
  }
}
```

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `404 Not Found`: Prediction not found or doesn't belong to user
```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Prediction not found"
  }
}
```

---

#### PATCH `/api/predictions/:id`
Update the note for a saved prediction.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Prediction ID |

**Query Parameters**: None

**Request Body**:
```json
{
  "note": "Updated analysis after checking team news"
}
```

**Request Validation**:
- `note`: optional, max 500 characters (can be null to clear note)

**Response Success** (200 OK):
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
      "away": 0.20
    },
    "note": "Updated analysis after checking team news",
    "home_score": null,
    "away_score": null
  }
}
```

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `404 Not Found`: Prediction not found or doesn't belong to user
```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Prediction not found"
  }
}
```
- `400 Bad Request`: Validation error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid note data",
    "details": {
      "field": "note",
      "issue": "Must be 500 characters or less"
    }
  }
}
```

**Business Logic**:
- Only allows updating the `note` field
- Other fields (prediction_result, teams, etc.) are immutable
- RLS ensures user can only update their own predictions

---

#### DELETE `/api/predictions/:id`
Delete a saved prediction.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Prediction ID |

**Query Parameters**: None

**Request Body**: None

**Response Success** (204 No Content)

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `404 Not Found`: Prediction not found or doesn't belong to user
```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Prediction not found"
  }
}
```

**Business Logic**:
- RLS ensures user can only delete their own predictions
- Cascade deletes are handled at database level

---

#### POST `/api/predictions/:id/fetch-result`
Fetch and cache the final match result for a completed match.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Prediction ID |

**Query Parameters**: None

**Request Body**: None

**Response Success** (200 OK):
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
      "away": 0.20
    },
    "note": "High confidence in home win",
    "home_score": 2,
    "away_score": 1
  }
}
```

**Response Errors**:
- `401 Unauthorized`: User not authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```
- `404 Not Found`: Prediction not found or doesn't belong to user
```json
{
  "error": {
    "code": "PREDICTION_NOT_FOUND",
    "message": "Prediction not found"
  }
}
```
- `409 Conflict`: Match has not finished yet
```json
{
  "error": {
    "code": "MATCH_NOT_FINISHED",
    "message": "Match result not available yet"
  }
}
```
- `503 Service Unavailable`: External API unavailable
```json
{
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Unable to fetch match result at this time"
  }
}
```

**Business Logic**:
- Fetches result from football-data.org API
- Caches result in `home_score` and `away_score` fields
- Subsequent calls return cached result (no external API call)
- Only works for completed matches

---

## 3. Authentication and Authorization

### Authentication Mechanism
The application uses **Supabase Auth** with JWT (JSON Web Token) based authentication:

1. **User Registration/Login**: Handled by Supabase Auth service
2. **Session Management**: Supabase SDK manages session tokens (access token + refresh token)
3. **Token Storage**: Tokens stored in browser cookies (httpOnly, secure)
4. **Token Validation**: Server-side middleware validates JWT on protected endpoints

### Implementation Details

#### Client-Side (Astro + React)
```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

#### Server-Side (Astro Middleware)
```typescript
// /src/middleware/index.ts
// Validate JWT and attach user context to request
export async function onRequest(context, next) {
  const token = context.cookies.get('sb-access-token')
  
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) {
      context.locals.user = user
    }
  }
  
  return next()
}
```

### Authorization Levels

#### Public Endpoints (No Authentication Required)
- `GET /api/matches`
- `POST /api/predictions/generate`

#### Protected Endpoints (Authentication Required)
- `GET /api/profile`
- `POST /api/predictions`
- `GET /api/predictions`
- `GET /api/predictions/:id`
- `PATCH /api/predictions/:id`
- `DELETE /api/predictions/:id`
- `POST /api/predictions/:id/fetch-result`

### Row Level Security (RLS)

The database enforces data isolation using PostgreSQL Row Level Security:

#### Profiles Table
- **SELECT**: Users can only view their own profile (`auth.uid() = id`)
- **UPDATE**: Users can only update their own profile (`auth.uid() = id`)
- **INSERT**: Blocked (profiles created automatically via trigger)
- **DELETE**: Blocked (profile deletion handled through Supabase Auth)

#### Predictions Table
- **SELECT**: Users can only view their own predictions (`auth.uid() = user_id`)
- **INSERT**: Users can only insert predictions with their own `user_id` (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own predictions (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own predictions (`auth.uid() = user_id`)

**Note**: As per migration `20251022120100_drop_rls_policies.sql`, all RLS policies have been dropped. These policies need to be recreated in a subsequent migration for the application to function securely.

---

## 4. Validation and Business Logic

### Validation Rules

#### Predictions Resource

**Field Validation**:
| Field | Rules |
|-------|-------|
| `league` | Required, non-empty string |
| `match_date` | Required, valid ISO 8601 timestamp |
| `home_team` | Required, non-empty string |
| `away_team` | Required, non-empty string |
| `prediction_result` | Required, valid JSON object with `home`, `draw`, `away` properties (all numbers 0-1, sum ≈ 1.0) |
| `note` | Optional, max 500 characters |
| `home_score` | Optional integer, ≥ 0 |
| `away_score` | Optional integer, ≥ 0 |

**Database Constraints**:
- `id`: Auto-incrementing primary key
- `created_at`: Auto-generated timestamp
- `user_id`: Must reference existing profile, cascade delete
- All NOT NULL constraints enforced at database level

### Business Logic Implementation

#### BL-001: 50 Prediction Limit (FR-017)
**Location**: `POST /api/predictions` endpoint

**Logic**:
```typescript
async function canCreatePrediction(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  return count < 50
}
```

**Error Response**: `403 Forbidden` with code `PREDICTION_LIMIT_REACHED`

---

#### BL-002: Automatic Profile Creation (DB Schema Requirement)
**Location**: Database trigger `on_auth_user_created`

**Logic**: When a new user signs up via Supabase Auth, a trigger automatically creates a corresponding profile record with the same UUID.

**Implementation**: Already handled by database migration trigger function `handle_new_user()`

---

#### BL-003: Immutable Prediction Data
**Location**: `PATCH /api/predictions/:id` endpoint

**Logic**: Only the `note` field can be updated. Core prediction data (`prediction_result`, `home_team`, `away_team`, `match_date`, `league`) is immutable after creation.

**Enforcement**: 
- Server-side validation ignores all fields except `note`
- Database RLS policies ensure users can only update their own records

---

#### BL-004: Result Caching (FR-016, FR-018)
**Location**: `POST /api/predictions/:id/fetch-result` endpoint

**Logic**:
1. Check if `home_score` and `away_score` are already set
2. If cached, return immediately without external API call
3. If not cached:
   - Verify match date is in the past
   - Fetch result from football-data.org API
   - Update prediction record with scores
   - Return updated record

**Benefits**:
- Reduces external API calls
- Improves response time for repeated requests
- Lowers operational costs

---

#### BL-005: Prediction Generation Caching (FR-018)
**Location**: `POST /api/predictions/generate` endpoint

**Logic**:
1. Generate cache key from match_id
2. Check cache (in-memory or Redis)
3. If cached and < 6 hours old, return cached prediction
4. Otherwise:
   - Fetch match statistics from football-data.org
   - Call OpenRouter.ai with match context
   - Parse and validate AI response
   - Store in cache with 6-hour TTL
   - Return prediction

**Cache Key Format**: `prediction:${match_id}`

**TTL**: 6 hours (predictions for upcoming matches can change as match approaches)

---

#### BL-006: Match List Caching (FR-018)
**Location**: `GET /api/matches` endpoint

**Logic**:
1. Generate cache key from league code
2. Check cache
3. If cached and < 1 hour old, return cached matches
4. Otherwise:
   - Fetch upcoming matches from football-data.org
   - Filter for matches within next 14 days
   - Sort by match_date ascending
   - Store in cache with 1-hour TTL
   - Return matches

**Cache Key Format**: `matches:${league_code}`

**TTL**: 1 hour (match schedules rarely change within a day)

---

#### BL-007: User Context Enforcement
**Location**: All authenticated endpoints

**Logic**: 
- `user_id` is always set from `auth.uid()` extracted from JWT
- Never accept `user_id` from request body
- RLS policies enforce user can only access their own data

**Implementation**:
```typescript
// Extract user ID from authenticated session
const userId = context.locals.user.id

// Override any user_id in request body
const data = {
  ...requestBody,
  user_id: userId
}
```

---

#### BL-008: Error Handling and Logging
**Location**: All endpoints

**Logic**:
- Catch all errors at endpoint level
- Log errors to monitoring service (e.g., Sentry)
- Return user-friendly error messages
- Never expose internal details (stack traces, DB errors)
- Use consistent error response format

**Error Response Format**:
```typescript
interface ErrorResponse {
  error: {
    code: string        // Machine-readable error code
    message: string     // User-friendly message
    details?: any       // Optional validation details
  }
}
```

---

## 5. External API Integration

### 5.1 Football-Data.org API

**Base URL**: `https://api.football-data.org/v4`

**Authentication**: API key in `X-Auth-Token` header

**Rate Limits**: 
- Free tier: 10 requests/minute
- Paid tier: Higher limits available

**Endpoints Used**:
- `GET /competitions/{code}/matches` - Get matches for a league
- `GET /matches/{id}` - Get specific match details including final score

**League Codes**:
- Premier League: `PL`
- La Liga: `PD`
- Bundesliga: `BL1`

**Error Handling**:
- 429 Too Many Requests: Return cached data or wait & retry
- 500 Server Error: Return `503 Service Unavailable` to client
- Network errors: Return `503 Service Unavailable` to client

---

### 5.2 OpenRouter.ai API

**Base URL**: `https://openrouter.ai/api/v1`

**Authentication**: Bearer token in `Authorization` header

**Rate Limits**: Configurable per API key

**Endpoints Used**:
- `POST /chat/completions` - Generate match prediction

**Request Format**:
```json
{
  "model": "meta-llama/llama-3.1-70b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are a football match prediction expert..."
    },
    {
      "role": "user",
      "content": "Predict the outcome for Arsenal vs Chelsea..."
    }
  ]
}
```

**Response Parsing**:
- Extract prediction probabilities from AI response
- Validate values are between 0 and 1
- Ensure sum is approximately 1.0
- Round to 2 decimal places

**Error Handling**:
- 429 Too Many Requests: Implement exponential backoff
- 500 Server Error: Return `503 Service Unavailable` to client
- Invalid AI response: Return `503 Service Unavailable` to client

---

## 6. Implementation Notes

### Technology Stack Integration

**Astro 5**:
- Server-side API endpoints in `/src/pages/api/`
- Each endpoint is a `.ts` file exporting HTTP method handlers
- Example: `/src/pages/api/predictions/index.ts` exports `GET` and `POST` functions

**TypeScript 5**:
- Shared types in `/src/types.ts`
- Generate database types from Supabase schema
- Strict type checking for all API payloads

**Supabase**:
- Client initialization in `/src/db/supabase.client.ts`
- Server-side client uses service role key for admin operations
- Client-side client uses anon key with RLS enforcement

### Caching Strategy

**Implementation Options**:
1. **In-Memory Cache** (MVP): Simple object store with TTL
2. **Redis** (Production): Distributed cache for scaling

**Cache Structure**:
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private store = new Map<string, CacheEntry<any>>()
  
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl: number): void
  clear(key: string): void
}
```

### Security Considerations

1. **Input Validation**: Validate all inputs on server-side before processing
2. **Rate Limiting**: Implement per-user rate limits on expensive endpoints
3. **CORS**: Configure CORS headers for production domain only
4. **SQL Injection**: Use parameterized queries (handled by Supabase SDK)
5. **XSS Prevention**: Sanitize user notes before storage and display
6. **CSRF Protection**: Use Supabase's built-in CSRF protection for auth
7. **API Key Management**: Store external API keys in environment variables, never in code

### Performance Optimization

1. **Database Indexes**: Index on `predictions.user_id` for fast user queries
2. **Pagination**: Always paginate list endpoints to prevent large payloads
3. **Lazy Loading**: Only fetch match results when explicitly requested
4. **Connection Pooling**: Use Supabase's built-in connection pooling
5. **CDN Caching**: Cache static assets and API responses where appropriate

### Monitoring and Logging

**Metrics to Track**:
- API response times (p50, p95, p99)
- Error rates by endpoint
- External API success/failure rates
- Cache hit/miss rates
- Active users and predictions created

**Logging Strategy**:
- Info: All API requests with method, path, user_id, duration
- Warning: External API failures, cache misses
- Error: All errors with stack traces and context

