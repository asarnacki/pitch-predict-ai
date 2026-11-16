export const prerender = false;

import type { APIRoute } from "astro";
import { generatePredictionBodySchema } from "@/lib/validation/schemas";
import { predictMatch } from "@/lib/services/prediction-model.service";
import { fetchMatchOdds, computeValue } from "@/lib/services/odds-provider.service";
import { cache } from "@/lib/services/cache.service";
import { formatError } from "@/lib/errors/formatter";
import { UnauthorizedError } from "@/lib/errors/api-errors";
import { BUSINESS_RULES, type GeneratePredictionResponseDTO } from "@/types";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) throw new UnauthorizedError();

    const body = await request.json();
    const matchData = generatePredictionBodySchema.parse(body);

    const cacheKey = `prediction:${matchData.match_id}`;
    const cached = cache.get<GeneratePredictionResponseDTO>(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ data: cached }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const footballApiKey = locals.runtime?.env?.FOOTBALL_DATA_API_KEY || import.meta.env.FOOTBALL_DATA_API_KEY;
    if (!footballApiKey) throw new Error("FOOTBALL_DATA_API_KEY not configured");

    const oddsApiKey = locals.runtime?.env?.ODDS_API_KEY || import.meta.env.ODDS_API_KEY;

    const [{ probabilities, modelOdds }, bookmaker] = await Promise.all([
      predictMatch(matchData, footballApiKey),
      fetchMatchOdds(
        {
          homeTeam: matchData.home_team,
          awayTeam: matchData.away_team,
          matchDate: matchData.match_date,
          league: matchData.league,
          matchId: matchData.match_id,
        },
        oddsApiKey ?? ""
      ),
    ]);

    const value = bookmaker ? computeValue(probabilities, bookmaker.odds) : null;

    const responseData: GeneratePredictionResponseDTO = {
      ...matchData,
      prediction: probabilities,
      modelOdds,
      bookmaker: bookmaker ?? null,
      value,
      generated_at: new Date().toISOString(),
    };

    const ttl = BUSINESS_RULES.PREDICTION_CACHE_TTL_HOURS * 60 * 60 * 1000;
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
