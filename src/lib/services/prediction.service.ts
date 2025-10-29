/**
 * Prediction Service
 *
 * Business logic for managing user predictions (saved matches).
 * Handles CRUD operations with validation and business rules enforcement.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { CreatePredictionDTO, PredictionDTO, GetPredictionsQueryParams, PaginatedPredictionsResponseDTO } from '@/types'
import { BUSINESS_RULES } from '@/types'
import { PredictionLimitError } from '@/lib/errors/api-errors'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Check if user has reached the prediction limit (50 predictions)
 *
 * @param supabase - Supabase client
 * @param userId - User ID from authenticated session
 * @throws PredictionLimitError if user has >= 50 predictions
 */
export async function checkPredictionLimit(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<void> {
  const { count, error } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to check prediction limit: ${error.message}`)
  }

  if (count !== null && count >= BUSINESS_RULES.MAX_PREDICTIONS_PER_USER) {
    throw new PredictionLimitError()
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
  if (!note) return null

  return note
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
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
  await checkPredictionLimit(supabase, userId)

  const sanitizedNote = sanitizeNote(data.note)

  const insertData = {
    user_id: userId, // Always from authenticated session
    league: data.league,
    match_date: data.match_date,
    home_team: data.home_team,
    away_team: data.away_team,
    prediction_result: data.prediction_result,
    note: sanitizedNote,
    home_score: null,
    away_score: null,
  }

  const { data: prediction, error } = await supabase
    .from('predictions')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[prediction.service] Create failed:', {
      userId,
      error: error.message,
    })
    throw new Error(`Failed to create prediction: ${error.message}`)
  }

  return prediction as PredictionDTO
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
  let query = supabase
    .from('predictions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (params.league) {
    query = query.eq('league', params.league)
  }

  const sortField = params.sort || 'created_at'
  const sortOrder = params.order || 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  const limit = params.limit || BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT
  const offset = params.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('[prediction.service] Get predictions failed:', {
      userId,
      params,
      error: error.message,
    })
    throw new Error(`Failed to fetch predictions: ${error.message}`)
  }

  const total = count || 0
  const hasMore = total > offset + limit

  return {
    predictions: (data || []) as PredictionDTO[],
    pagination: {
      total,
      limit,
      offset,
      has_more: hasMore,
    },
  }
}
