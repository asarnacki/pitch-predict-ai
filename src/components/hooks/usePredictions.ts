import { useState, useCallback } from "react";
import { predictionsService } from "@/services/api/predictions.service";
import type { MatchDTO, UserChoice } from "@/types";
import { ApiError } from "@/services/api/client";
import { getLeagueCodeFromName } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface PredictionState {
  status: "idle" | "loading" | "success" | "error";
  data: {
    match_id: string;
    home_team: string;
    away_team: string;
    league: string;
    match_date: string;
    prediction: {
      home_win: number;
      draw: number;
      away_win: number;
    };
    generated_at: string;
  } | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  error: string | null;
}

export function usePredictions() {
  const t = useTranslation();
  const [predictions, setPredictions] = useState<Record<string, PredictionState>>({});

  const generatePrediction = useCallback(
    async (match: MatchDTO) => {
      const matchId = match.id;

      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          status: "loading",
          data: null,
          saveStatus: "idle",
          error: null,
        },
      }));

      try {
        const result = await predictionsService.generatePrediction({
          match_id: match.id,
          home_team: match.home_team.name,
          away_team: match.away_team.name,
          league: getLeagueCodeFromName(match.league),
          match_date: match.match_date,
        });

        setPredictions((prev) => ({
          ...prev,
          [matchId]: {
            status: "success",
            data: result,
            saveStatus: "idle",
            error: null,
          },
        }));
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : t.predictions.errors.generateFailed;

        setPredictions((prev) => ({
          ...prev,
          [matchId]: {
            status: "error",
            data: null,
            saveStatus: "idle",
            error: errorMessage,
          },
        }));
      }
    },
    [t]
  );

  const savePrediction = useCallback(
    async (matchId: string, note: string | null, userChoice: UserChoice | null) => {
      const prediction = predictions[matchId];

      if (!prediction?.data) {
        return;
      }

      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          saveStatus: "saving",
        },
      }));

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

        setPredictions((prev) => ({
          ...prev,
          [matchId]: {
            ...prev[matchId],
            saveStatus: "saved",
          },
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : t.predictions.errors.saveFailed;

        setPredictions((prev) => ({
          ...prev,
          [matchId]: {
            ...prev[matchId],
            saveStatus: "error",
            error: errorMessage,
          },
        }));

        throw error;
      }
    },
    [predictions, t]
  );

  return {
    predictions,
    generatePrediction,
    savePrediction,
  };
}
