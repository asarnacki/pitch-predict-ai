import { apiClient } from "./client";
import type { MatchDTO, MatchesResponseDTO, ApiSuccessResponse } from "@/types";
import { LEAGUE_CODES } from "@/types";

export type LeagueCode = keyof typeof LEAGUE_CODES;

export const matchesService = {
  async fetchMatches(league: LeagueCode, limit = 5): Promise<MatchDTO[]> {
    const leagueCode = LEAGUE_CODES[league];

    const response = await apiClient<ApiSuccessResponse<MatchesResponseDTO>>(
      `/api/matches?league=${leagueCode}&limit=${limit}`
    );

    return response.data.matches;
  },
};
