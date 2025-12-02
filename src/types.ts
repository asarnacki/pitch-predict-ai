/**
 * Shared Types for PitchPredict AI
 *
 * This file contains all DTOs (Data Transfer Objects) and Command Models
 * used across the application's backend and frontend.
 *
 * All types are derived from database models (database.types.ts) where applicable.
 */

import type { Tables, TablesInsert } from "./db/database.types";

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Profile DTO - User profile data
 * Maps directly to the profiles table Row type
 */
export type ProfileDTO = Tables<"profiles">;

// ============================================================================
// MATCH DTOs (External API - football-data.org)
// ============================================================================

/**
 * Individual match data from external football API
 * Not stored in database - fetched from football-data.org
 */
export interface MatchDTO {
  id: string;
  home_team: Team;
  away_team: Team;
  match_date: string; // ISO 8601 timestamp
  league: string;
  status: string; // e.g., "SCHEDULED", "FINISHED"
}

/**
 * Response wrapper for matches list endpoint
 * GET /api/matches
 */
export interface MatchesResponseDTO {
  league: string;
  matches: MatchDTO[];
  cached_at: string; // ISO 8601 timestamp
}

/**
 * Query parameters for GET /api/matches
 */
export interface GetMatchesQueryParams {
  league: "PL" | "PD" | "BL1"; // Premier League, La Liga, Bundesliga
  limit?: number; // 1-50, default: 20
}

// ============================================================================
// PREDICTION PROBABILITIES
// ============================================================================

/**
 * AI-generated prediction probabilities for match outcomes
 * Maps to the JSON structure stored in predictions.prediction_result
 */
export interface PredictionProbabilities {
  home: number; // 0-1, probability of home win
  draw: number; // 0-1, probability of draw
  away: number; // 0-1, probability of away win
}

/**
 * User's prediction choice - which team they think will win
 */
export type UserChoice = "home" | "draw" | "away";

// ============================================================================
// AI PREDICTION DTOs
// ============================================================================

/**
 * Request body for generating AI prediction
 * POST /api/predictions/generate
 */
export interface GeneratePredictionRequestDTO {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string; // ISO 8601 timestamp
}

/**
 * Response from AI prediction generation
 * POST /api/predictions/generate
 */
export interface GeneratePredictionResponseDTO {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string; // ISO 8601 timestamp
  prediction: PredictionProbabilities;
  generated_at: string; // ISO 8601 timestamp
}

// ============================================================================
// SAVED PREDICTION DTOs
// ============================================================================

/**
 * Full prediction object - Response DTO
 * Maps directly to the predictions table Row type
 *
 * Used in responses for:
 * - POST /api/predictions
 * - GET /api/predictions
 * - GET /api/predictions/:id
 * - PATCH /api/predictions/:id
 * - POST /api/predictions/:id/fetch-result
 */
export type PredictionDTO = Tables<"predictions">;

/**
 * Command Model for creating a new prediction
 * POST /api/predictions
 *
 * Derived from TablesInsert but excludes server-controlled fields:
 * - id (auto-generated)
 * - created_at (auto-generated)
 * - user_id (set from authenticated session)
 */
export type CreatePredictionDTO = Omit<TablesInsert<"predictions">, "id" | "created_at" | "user_id"> & {
  // Override prediction_result type from Json to PredictionProbabilities for type safety
  prediction_result: PredictionProbabilities;
};

/**
 * Command Model for updating a prediction
 * PATCH /api/predictions/:id
 *
 * Only allows updating the note field (immutable prediction data)
 */
export interface UpdatePredictionDTO {
  note?: string | null;
}

/**
 * Represents a generic cache entry with a Time-To-Live (TTL)
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number; // a timestamp in milliseconds when the data was stored.
  ttl: number; // TTL in milliseconds
}

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMetadata {
  total: number; // Total number of items
  limit: number; // Items per page
  offset: number; // Number of items skipped
  has_more: boolean; // Whether there are more pages
}

/**
 * Paginated response for predictions list
 * GET /api/predictions
 */
export interface PaginatedPredictionsResponseDTO {
  predictions: PredictionDTO[];
  pagination: PaginationMetadata;
}

/**
 * Query parameters for GET /api/predictions
 */
export interface GetPredictionsQueryParams {
  limit?: number; // 1-50, default: 20
  offset?: number; // ≥0, default: 0
  sort?: "created_at" | "match_date"; // default: created_at
  order?: "asc" | "desc"; // default: desc
  league?: string; // Filter by league name
}

// ============================================================================
// COMMON API RESPONSE TYPES
// ============================================================================

/**
 * Generic success response wrapper
 * All successful API responses follow this structure
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Error response structure
 * All error responses follow this structure
 */
export type ApiErrorDetails = unknown;

export interface ApiErrorResponse {
  error: {
    code: string; // Machine-readable error code (e.g., "UNAUTHORIZED")
    message: string; // User-friendly error message
    details?: ApiErrorDetails; // Optional validation details or additional context
  };
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Supported league codes for match queries
 */
export const LEAGUE_CODES = {
  PREMIER_LEAGUE: "PL",
  LA_LIGA: "PD",
  BUNDESLIGA: "BL1",
} as const;

/**
 * Supported league names for predictions
 */
export const LEAGUE_NAMES = {
  PREMIER_LEAGUE: "Premier League",
  LA_LIGA: "La Liga",
  BUNDESLIGA: "Bundesliga",
} as const;

/**
 * Supported league names to codes
 */
export const LEAGUE_NAME_TO_CODE: Record<string, string> = {
  "Premier League": LEAGUE_CODES.PREMIER_LEAGUE,
  "La Liga": LEAGUE_CODES.LA_LIGA,
  Bundesliga: LEAGUE_CODES.BUNDESLIGA,
};

/**
 * Business logic constants
 */
export const BUSINESS_RULES = {
  MAX_PREDICTIONS_PER_USER: 50,
  MAX_NOTE_LENGTH: 500,
  MAX_MATCHES_LIMIT: 50,
  DEFAULT_MATCHES_LIMIT: 20,
  DEFAULT_PREDICTIONS_LIMIT: 20,
  PREDICTION_CACHE_TTL_HOURS: 6,
  MATCHES_CACHE_TTL_HOURS: 1,
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid PredictionProbabilities object
 */
export function isPredictionProbabilities(value: unknown): value is PredictionProbabilities {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.home === "number" &&
    typeof obj.draw === "number" &&
    typeof obj.away === "number" &&
    obj.home >= 0 &&
    obj.home <= 1 &&
    obj.draw >= 0 &&
    obj.draw <= 1 &&
    obj.away >= 0 &&
    obj.away <= 1 &&
    Math.abs(obj.home + obj.draw + obj.away - 1) < 0.01 // Sum should be ~1.0
  );
}

/**
 * Type guard to check if a league code is valid
 */
const leagueCodeValues = Object.values(LEAGUE_CODES) as (typeof LEAGUE_CODES)[keyof typeof LEAGUE_CODES][];

export function isValidLeagueCode(value: unknown): value is (typeof LEAGUE_CODES)[keyof typeof LEAGUE_CODES] {
  if (typeof value !== "string") return false;
  return leagueCodeValues.includes(value as (typeof LEAGUE_CODES)[keyof typeof LEAGUE_CODES]);
}

/**
 * Type guard to check if a league name is valid
 */
const leagueNameValues = Object.values(LEAGUE_NAMES) as (typeof LEAGUE_NAMES)[keyof typeof LEAGUE_NAMES][];

export function isValidLeagueName(value: unknown): value is (typeof LEAGUE_NAMES)[keyof typeof LEAGUE_NAMES] {
  if (typeof value !== "string") return false;
  return leagueNameValues.includes(value as (typeof LEAGUE_NAMES)[keyof typeof LEAGUE_NAMES]);
}

/*
 * Not stored in database - fetched from football-data.org
 */
export interface Team {
  id: number;
  name: string;
  logo: string;
}
