/**
 * GET /api/profile
 *
 * Returns the authenticated user's profile.
 *
 * Authentication: Required
 * Response: 200 OK with ProfileDTO
 * Errors: 401 UNAUTHORIZED, 404 PROFILE_NOT_FOUND
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getProfile } from "@/lib/services/profile.service";
import { UnauthorizedError, NotFoundError } from "@/lib/errors/api-errors";
import { formatError } from "@/lib/errors/formatter";

/**
 * GET handler for /api/profile
 *
 * Returns authenticated user's profile data.
 * User ID is extracted from JWT token via middleware.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.user) {
      throw new UnauthorizedError();
    }

    const profile = await getProfile(locals.supabase, locals.user.id);

    if (!profile) {
      throw new NotFoundError("PROFILE_NOT_FOUND", "User profile not found");
    }

    return new Response(JSON.stringify({ data: profile }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const { status, body } = formatError(error);

    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
