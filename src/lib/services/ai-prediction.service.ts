import type { GeneratePredictionRequestDTO, PredictionProbabilities } from "@/types";
import { isPredictionProbabilities } from "@/types";
import { ExternalServiceError } from "@/lib/errors/api-errors";

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}]/g, "")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 100);
}

export async function generatePrediction(
  matchData: GeneratePredictionRequestDTO,
  apiKey: string,
  model?: string
): Promise<PredictionProbabilities> {
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const modelToUse = model || "meta-llama/llama-3.1-70b-instruct";

  // Sanitize inputs
  const homeTeam = sanitizeInput(matchData.home_team);
  const awayTeam = sanitizeInput(matchData.away_team);
  const league = sanitizeInput(matchData.league);

  const systemPrompt = `You are a football match prediction expert. Analyze matches and provide win probabilities.
Always respond with ONLY a JSON object in this exact format:
{"home": 0.XX, "draw": 0.XX, "away": 0.XX}
The three probabilities must sum to 1.0.`;

  const userPrompt = `Predict the outcome for this match:
League: ${league}
Home Team: ${homeTeam}
Away Team: ${awayTeam}
Match Date: ${matchData.match_date}

Provide probabilities for home win, draw, and away win.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new ExternalServiceError("Unable to generate prediction at this time");
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new ExternalServiceError("Invalid AI response format");

    const prediction = JSON.parse(content.trim());

    if (!isPredictionProbabilities(prediction)) throw new ExternalServiceError("Invalid prediction probabilities");

    return prediction;
  } catch (error) {
    if (error instanceof ExternalServiceError) throw error;
    if (error instanceof SyntaxError) throw new ExternalServiceError("Failed to parse AI response");

    throw new ExternalServiceError("Unable to generate prediction at this time");
  }
}
