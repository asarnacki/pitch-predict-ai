import { ref } from "vue";
import { predictionsService } from "@/services/api/predictions.service";
import type { GeneratePredictionResponseDTO, MatchDTO, UserChoice } from "@/types";
import { ApiError } from "@/services/api/client";
import { getLeagueCodeFromName } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface PredictionState {
  status: "idle" | "loading" | "success" | "error";
  data: GeneratePredictionResponseDTO | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  error: string | null;
}

export function usePredictions() {
  const t = useTranslation();
  const predictions = ref<Record<string, PredictionState>>({});

  const generatePrediction = async (match: MatchDTO) => {
    const matchId = match.id;

    predictions.value[matchId] = {
      status: "loading",
      data: null,
      saveStatus: "idle",
      error: null,
    };

    try {
      const result = await predictionsService.generatePrediction({
        match_id: match.id,
        home_team: match.home_team.name,
        away_team: match.away_team.name,
        league: getLeagueCodeFromName(match.league),
        match_date: match.match_date,
      });

      predictions.value[matchId] = {
        status: "success",
        data: result,
        saveStatus: "idle",
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : t.value.predictions.errors.generateFailed;

      predictions.value[matchId] = {
        status: "error",
        data: null,
        saveStatus: "idle",
        error: errorMessage,
      };
    }
  };

  const savePrediction = async (matchId: string, note: string | null, userChoice: UserChoice | null) => {
    const prediction = predictions.value[matchId];

    if (!prediction?.data) {
      return;
    }

    prediction.saveStatus = "saving";

    try {
      const result = await predictionsService.savePrediction({
        match_id: prediction.data.match_id,
        home_team: prediction.data.home_team,
        away_team: prediction.data.away_team,
        league: prediction.data.league,
        match_date: prediction.data.match_date,
        prediction_result: prediction.data.prediction,
        user_choice: userChoice,
        note,
      });

      prediction.saveStatus = "saved";

      return result;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : t.value.predictions.errors.saveFailed;

      prediction.saveStatus = "error";
      prediction.error = errorMessage;

      throw error;
    }
  };

  return {
    predictions,
    generatePrediction,
    savePrediction,
  };
}
