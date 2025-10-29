/**
 * /api/predictions
 *
 * GET: Fetch paginated list of user's predictions with filtering and sorting
 * POST: Save a new prediction to user's "watched matches" list
 *
 * Authentication: Required for both
 *
 * GET Endpoint:
 *   - Query params: limit, offset, sort, order, league
 *   - Response: 200 OK with PaginatedPredictionsResponseDTO
 *   - Errors:
 *     - 401 UNAUTHORIZED (not authenticated)
 *     - 400 INVALID_PARAMETERS (invalid query params)
 *     - 500 INTERNAL_ERROR (database error)
 *
 * POST Endpoint:
 *   - Request: CreatePredictionDTO (validated with Zod)
 *   - Response: 201 Created with PredictionDTO
 *   - Errors:
 *     - 401 UNAUTHORIZED (not authenticated)
 *     - 400 VALIDATION_ERROR (invalid request data)
 *     - 403 PREDICTION_LIMIT_REACHED (user has 50+ predictions)
 *     - 500 INTERNAL_ERROR (database error)
 */

export const prerender = false

import type { APIRoute } from 'astro'
import type { CreatePredictionDTO, GetPredictionsQueryParams } from '@/types'
import { createPredictionBodySchema, getPredictionsQuerySchema } from '@/lib/validation/schemas'
import { createPrediction, getPredictions } from '@/lib/services/prediction.service'
import { UnauthorizedError } from '@/lib/errors/api-errors'
import { formatError } from '@/lib/errors/formatter'

/**
 * GET handler for /api/predictions
 *
 * Fetches paginated list of predictions for the authenticated user.
 * Supports filtering by league and sorting by created_at or match_date.
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError()
    }

    const url = new URL(request.url)
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      sort: url.searchParams.get('sort'),
      order: url.searchParams.get('order'),
      league: url.searchParams.get('league'),
    }

    const validatedParams = getPredictionsQuerySchema.parse(queryParams) as GetPredictionsQueryParams

    const result = await getPredictions(
      locals.supabase,
      locals.user.id,
      validatedParams
    )

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const { status, body } = formatError(error)

    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * POST handler for /api/predictions
 *
 * Creates a new prediction for the authenticated user.
 * User ID is extracted from JWT token via middleware.
 * Enforces max 50 predictions per user limit.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError()
    }

    const body = await request.json()
    const validatedData = createPredictionBodySchema.parse(body) as CreatePredictionDTO

    const prediction = await createPrediction(
      locals.supabase,
      locals.user.id,
      validatedData
    )

    return new Response(JSON.stringify({ data: prediction }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const { status, body } = formatError(error)

    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
