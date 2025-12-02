export const prerender = false;

import type { APIRoute } from "astro";
import { getMatchesQuerySchema } from "@/lib/validation/schemas";
import { fetchUpcomingMatches } from "@/lib/services/football-data.service";
import { cache } from "@/lib/services/cache.service";
import { formatError } from "@/lib/errors/formatter";
import { BUSINESS_RULES, type MatchesResponseDTO } from "@/types";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const queryParams = {
      league: url.searchParams.get("league"),
      limit: url.searchParams.get("limit"),
    };

    const { league, limit } = getMatchesQuerySchema.parse(queryParams);

    const cacheKey = `matches:${league}`;
    const cached = cache.get<MatchesResponseDTO>(cacheKey);

    if (cached) {
      return new Response(JSON.stringify({ data: cached }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const matches = await fetchUpcomingMatches(league, limit);

    const responseData: MatchesResponseDTO = {
      league,
      matches,
      cached_at: new Date().toISOString(),
    };

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
