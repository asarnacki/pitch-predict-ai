/**
 * /api/predictions/:id
 *
 * GET: Fetch a single prediction by ID for the authenticated user
 * PATCH: Update ONLY the note field of a prediction (all other fields immutable)
 * DELETE: Delete a prediction by ID
 *
 * Authentication: Required
 *
 * GET Endpoint:
 *   - Path params: id (positive integer)
 *   - Response: 200 OK with PredictionDTO
 *   - Errors:
 *     - 401 UNAUTHORIZED (not authenticated)
 *     - 400 VALIDATION_ERROR (invalid ID format)
 *     - 404 PREDICTION_NOT_FOUND (prediction doesn't exist or belongs to another user)
 *     - 500 INTERNAL_ERROR (database error)
 *
 * PATCH Endpoint:
 *   - Path params: id (positive integer)
 *   - Body: { note: string | null } (max 500 chars, null to clear)
 *   - Response: 200 OK with updated PredictionDTO
 *   - Errors: Same as GET
 *
 * DELETE Endpoint:
 *   - Path params: id (positive integer)
 *   - Response: 204 No Content
 *   - Errors: Same as GET
 */

export const prerender = false

import type { APIRoute } from 'astro'
import { predictionIdParamSchema, updatePredictionBodySchema } from '@/lib/validation/schemas'
import { getPredictionById, updatePredictionNote, deletePrediction } from '@/lib/services/prediction.service'
import { UnauthorizedError, NotFoundError } from '@/lib/errors/api-errors'
import { formatError } from '@/lib/errors/formatter'

/**
 * GET handler for /api/predictions/:id
 *
 * Fetches a single prediction by ID for the authenticated user.
 * Returns 404 if prediction doesn't exist or belongs to another user (security - don't leak info).
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError()
    }

    const validatedParams = predictionIdParamSchema.parse({ id: params.id })

    const prediction = await getPredictionById(
      locals.supabase,
      locals.user.id,
      validatedParams.id
    )

    if (!prediction) {
      throw new NotFoundError('PREDICTION_NOT_FOUND', 'Prediction not found')
    }

    return new Response(JSON.stringify({ data: prediction }), {
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
 * PATCH handler for /api/predictions/:id
 *
 * Updates ONLY the note field of a prediction. All other fields are immutable.
 * Returns 404 if prediction doesn't exist or belongs to another user (security - don't leak info).
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError()
    }

    const validatedParams = predictionIdParamSchema.parse({ id: params.id })

    const body = await request.json()
    const validatedBody = updatePredictionBodySchema.parse(body)

    const prediction = await updatePredictionNote(
      locals.supabase,
      locals.user.id,
      validatedParams.id,
      validatedBody.note
    )

    if (!prediction) {
      throw new NotFoundError('PREDICTION_NOT_FOUND', 'Prediction not found')
    }

    return new Response(JSON.stringify({ data: prediction }), {
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
 * DELETE handler for /api/predictions/:id
 *
 * Deletes a prediction by ID for the authenticated user.
 * Returns 404 if prediction doesn't exist or belongs to another user (security - don't leak info).
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError()
    }

    const validatedParams = predictionIdParamSchema.parse({ id: params.id })

    const deleted = await deletePrediction(
      locals.supabase,
      locals.user.id,
      validatedParams.id
    )

    if (!deleted) {
      throw new NotFoundError('PREDICTION_NOT_FOUND', 'Prediction not found')
    }

    return new Response(null, {
      status: 204,
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
