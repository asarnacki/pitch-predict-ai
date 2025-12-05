/**
 * Prediction Service
 *
 * Business logic for managing user predictions (saved matches).
 * Handles CRUD operations with validation and business rules enforcement.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  CreatePredictionDTO,
  PredictionDTO,
  GetPredictionsQueryParams,
  PaginatedPredictionsResponseDTO,
} from "@/types";
import { BUSINESS_RULES } from "@/types";
import { PredictionLimitError, NotFoundError, ConflictError } from "@/lib/errors/api-errors";
import { fetchMatchResult } from "./football-data.service";
import { logError } from "@/lib/logger";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Check if user has reached the prediction limit (50 predictions)
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @throws PredictionLimitError if user has >= 50 predictions
 */
export async function checkPredictionLimit(supabase: TypedSupabaseClient, userId: string): Promise<void> {
  const { count, error } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to check prediction limit: ${error.message}`);
  }

  if (count !== null && count >= BUSINESS_RULES.MAX_PREDICTIONS_PER_USER) {
    throw new PredictionLimitError();
  }
}

/**
 * Sanitize note field to prevent XSS attacks
 *
 * Escapes HTML special characters: < and >
 * This prevents injection of script tags or HTML elements
 *
 * @param note - User-provided note (optional)
 * @returns Sanitized note or null
 */
export function sanitizeNote(note?: string | null): string | null {
  if (!note) return null;

  return note.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

/**
 * Create a new prediction (save match to user's list)
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session (NEVER from request body)
 * @param data - Prediction data from validated request body
 * @returns Created prediction with all fields
 * @throws PredictionLimitError if user has >= 50 predictions
 * @throws Error if database operation fails
 */
export async function createPrediction(
  supabase: TypedSupabaseClient,
  userId: string,
  data: CreatePredictionDTO
): Promise<PredictionDTO> {
  await checkPredictionLimit(supabase, userId);

  const sanitizedNote = sanitizeNote(data.note);

  const insertData = {
    user_id: userId,
    league: data.league,
    match_date: data.match_date,
    home_team: data.home_team,
    away_team: data.away_team,
    prediction_result: data.prediction_result,
    user_choice: data.user_choice || null,
    note: sanitizedNote,
    home_score: null,
    away_score: null,
    match_id: data.match_id || null,
  };

  const { data: prediction, error } = await supabase.from("predictions").insert(insertData).select().single();

  if (error) {
    logError("[prediction.service] Create failed", {
      userId,
      error: error.message,
    });
    throw new Error(`Failed to create prediction: ${error.message}`);
  }

  return prediction as PredictionDTO;
}

/**
 * Get paginated list of user's predictions with filtering and sorting
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @param params - Query parameters (limit, offset, sort, order, league)
 * @returns Paginated predictions with metadata
 * @throws Error if database operation fails
 */
export async function getPredictions(
  supabase: TypedSupabaseClient,
  userId: string,
  params: GetPredictionsQueryParams
): Promise<PaginatedPredictionsResponseDTO> {
  let query = supabase.from("predictions").select("*", { count: "exact" }).eq("user_id", userId);

  if (params.league) {
    query = query.eq("league", params.league);
  }

  const sortField = params.sort || "created_at";
  const sortOrder = params.order || "desc";
  query = query.order(sortField, { ascending: sortOrder === "asc" });

  const limit = params.limit || BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    logError("[prediction.service] Get predictions failed", {
      userId,
      params,
      error: error.message,
    });
    throw new Error(`Failed to fetch predictions: ${error.message}`);
  }

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

/**
 * Get a single prediction by ID for the authenticated user
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @param predictionId - Prediction ID from path parameter
 * @returns Prediction data or null if not found or doesn't belong to user
 * @throws Error if database operation fails
 */
export async function getPredictionById(
  supabase: TypedSupabaseClient,
  userId: string,
  predictionId: number
): Promise<PredictionDTO | null> {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("id", predictionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    logError("[prediction.service] Get prediction by ID failed", {
      userId,
      predictionId,
      error: error.message,
    });
    throw new Error(`Failed to fetch prediction: ${error.message}`);
  }

  return data as PredictionDTO;
}

/**
 * Update ONLY the note field of a prediction
 *
 * All other fields (prediction_result, match data, scores) are immutable.
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @param predictionId - Prediction ID from path parameter
 * @param note - New note value (can be null to clear)
 * @returns Updated prediction or null if not found or doesn't belong to user
 * @throws Error if database operation fails
 */
export async function updatePredictionNote(
  supabase: TypedSupabaseClient,
  userId: string,
  predictionId: number,
  note: string | null | undefined
): Promise<PredictionDTO | null> {
  const sanitizedNote = sanitizeNote(note);

  const { data, error } = await supabase
    .from("predictions")
    .update({ note: sanitizedNote })
    .eq("id", predictionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    logError("[prediction.service] Update prediction note failed", {
      userId,
      predictionId,
      error: error.message,
    });
    throw new Error(`Failed to update prediction: ${error.message}`);
  }

  return data as PredictionDTO;
}

/**
 * Delete a prediction by ID
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @param predictionId - Prediction ID from path parameter
 * @returns true if deleted, false if not found or doesn't belong to user
 * @throws Error if database operation fails
 */
export async function deletePrediction(
  supabase: TypedSupabaseClient,
  userId: string,
  predictionId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("predictions")
    .delete()
    .eq("id", predictionId)
    .eq("user_id", userId)
    .select();

  if (error) {
    logError("[prediction.service] Delete prediction failed", {
      userId,
      predictionId,
      error: error.message,
    });
    throw new Error(`Failed to delete prediction: ${error.message}`);
  }

  return data && data.length > 0;
}

/**
 * Check if a match is finished based on match date with 3-hour buffer
 *
 * @param matchDate - ISO 8601 timestamp of the match
 * @returns true if match is finished (current time > match time + 3 hours)
 */
function isMatchFinished(matchDate: string): boolean {
  const matchTime = new Date(matchDate).getTime();
  const now = Date.now();
  const threeHours = 3 * 60 * 60 * 1000;
  return now - matchTime > threeHours;
}

/**
 * Fetch and cache match result from external API
 *
 * This function:
 * 1. Fetches the prediction from database
 * 2. Returns early if result is already cached (home_score and away_score are set)
 * 3. Validates match_id exists
 * 4. Checks if match is finished (3-hour buffer)
 * 5. Fetches result from football-data.org API
 * 6. Caches result in database
 * 7. Returns updated prediction
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @param predictionId - Prediction ID from path parameter
 * @returns Updated prediction with scores
 * @throws NotFoundError if prediction not found or doesn't belong to user
 * @throws ConflictError if match not finished or match_id missing
 * @throws ExternalServiceError if API call fails
 */
export async function fetchAndCacheResult(
  supabase: TypedSupabaseClient,
  userId: string,
  predictionId: number,
  apiKey: string
): Promise<PredictionDTO> {
  const prediction = await getPredictionById(supabase, userId, predictionId);

  if (!prediction) {
    throw new NotFoundError("PREDICTION_NOT_FOUND", "Prediction not found");
  }

  if (prediction.home_score !== null && prediction.away_score !== null) {
    return prediction;
  }

  if (!prediction.match_id) {
    throw new ConflictError("MATCH_ID_MISSING", "Cannot fetch result: match_id not available");
  }

  if (!isMatchFinished(prediction.match_date)) {
    throw new ConflictError("MATCH_NOT_FINISHED", "Match result not available yet");
  }

  // Fetch result from external API
  const result = await fetchMatchResult(prediction.match_id, apiKey);

  // Update prediction with scores
  const { data, error } = await supabase
    .from("predictions")
    .update({
      home_score: result.home_score,
      away_score: result.away_score,
    })
    .eq("id", predictionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    logError("[prediction.service] Fetch and cache result failed", {
      userId,
      predictionId,
      error: error.message,
    });
    throw new Error(`Failed to cache match result: ${error.message}`);
  }

  return data as PredictionDTO;
}
