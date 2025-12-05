/**
 * /api/predictions/:id/fetch-result
 *
 * POST: Fetch and cache match result for a prediction
 *
 * Authentication: Required
 *
 * POST Endpoint:
 *   - Path param: id (prediction ID)
 *   - Response: 200 OK with PredictionDTO (including home_score and away_score)
 *   - Errors:
 *     - 401 UNAUTHORIZED (not authenticated)
 *     - 404 PREDICTION_NOT_FOUND (prediction not found or doesn't belong to user)
 *     - 409 MATCH_NOT_FINISHED (match hasn't finished yet - 3 hour buffer)
 *     - 409 MATCH_ID_MISSING (prediction has no match_id)
 *     - 503 EXTERNAL_SERVICE_ERROR (football-data.org API error)
 *     - 500 INTERNAL_ERROR (database error)
 *
 * Behavior:
 *   - If scores already cached (home_score and away_score are set), returns immediately
 *   - Otherwise, fetches result from football-data.org API and caches in database
 *   - Checks if match is finished (current time > match time + 3 hours)
 *   - Returns updated prediction with scores
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { predictionIdParamSchema } from "@/lib/validation/schemas";
import { fetchAndCacheResult } from "@/lib/services/prediction.service";
import { UnauthorizedError } from "@/lib/errors/api-errors";
import { formatError } from "@/lib/errors/formatter";

export const POST: APIRoute = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError();
    }

    const { id } = predictionIdParamSchema.parse(params);

    // Get API key from Cloudflare Workers runtime or fallback to import.meta.env
    const apiKey = locals.runtime?.env?.FOOTBALL_DATA_API_KEY || import.meta.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      throw new Error("FOOTBALL_DATA_API_KEY not configured");
    }

    const prediction = await fetchAndCacheResult(locals.supabase, locals.user.id, id, apiKey);

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
