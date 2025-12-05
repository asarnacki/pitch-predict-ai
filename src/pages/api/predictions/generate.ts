export const prerender = false;

import type { APIRoute } from "astro";
import { generatePredictionBodySchema } from "@/lib/validation/schemas";
import { generatePrediction } from "@/lib/services/ai-prediction.service";
import { cache } from "@/lib/services/cache.service";
import { formatError } from "@/lib/errors/formatter";
import { BUSINESS_RULES, type GeneratePredictionResponseDTO } from "@/types";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    // Get API key from Cloudflare Workers runtime or fallback to import.meta.env
    const apiKey = locals.runtime?.env?.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const prediction = await generatePrediction(matchData, apiKey);

    const responseData: GeneratePredictionResponseDTO = {
      ...matchData,
      prediction,
      generated_at: new Date().toISOString(),
    };

    // Cache for 6 hours
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
