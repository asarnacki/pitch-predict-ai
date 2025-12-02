import { apiClient } from "./client";
import type {
  GeneratePredictionRequestDTO,
  GeneratePredictionResponseDTO,
  CreatePredictionDTO,
  PredictionDTO,
  ApiSuccessResponse,
} from "@/types";

export const predictionsService = {
  async generatePrediction(matchData: GeneratePredictionRequestDTO): Promise<GeneratePredictionResponseDTO> {
    const response = await apiClient<ApiSuccessResponse<GeneratePredictionResponseDTO>>("/api/predictions/generate", {
      method: "POST",
      body: JSON.stringify(matchData),
    });

    return response.data;
  },

  async savePrediction(predictionData: CreatePredictionDTO): Promise<PredictionDTO> {
    const response = await apiClient<ApiSuccessResponse<PredictionDTO>>("/api/predictions", {
      method: "POST",
      body: JSON.stringify(predictionData),
    });

    return response.data;
  },
};
