import { useState, useEffect, useCallback } from "react";
import { matchesService, type LeagueCode } from "@/services/api/matches.service";
import type { MatchDTO } from "@/types";
import { ApiError } from "@/services/api/client";
import { useTranslation } from "@/lib/i18n";

interface MatchesState {
  league: LeagueCode;
  matchesCache: Record<LeagueCode, MatchDTO[]>;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}

export function useMatches(initialLeague: LeagueCode = "PREMIER_LEAGUE") {
  const t = useTranslation();
  const [state, setState] = useState<MatchesState>({
    league: initialLeague,
    matchesCache: {
      PREMIER_LEAGUE: [],
      LA_LIGA: [],
      BUNDESLIGA: [],
    },
    status: "idle",
    error: null,
  });

  const fetchMatches = useCallback(
    async (targetLeague: LeagueCode) => {
      setState((prev) => ({
        ...prev,
        status: "loading",
        error: null,
      }));

      try {
        const matches = await matchesService.fetchMatches(targetLeague, 5);

        setState((prev) => ({
          ...prev,
          matchesCache: {
            ...prev.matchesCache,
            [targetLeague]: matches,
          },
          status: "success",
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : t.predictions.errors.fetchMatchesFailed;

        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
      }
    },
    [t]
  );

  const changeLeague = useCallback(
    (newLeague: LeagueCode) => {
      setState((prev) => ({
        ...prev,
        league: newLeague,
      }));

      if (state.matchesCache[newLeague].length === 0) {
        fetchMatches(newLeague);
      }
    },
    [state.matchesCache, fetchMatches]
  );

  const refetch = useCallback(() => {
    fetchMatches(state.league);
  }, [state.league, fetchMatches]);

  useEffect(() => {
    if (state.matchesCache[state.league].length === 0) {
      fetchMatches(state.league);
    }
  }, [fetchMatches, state.league, state.matchesCache]);

  return {
    league: state.league,
    matches: state.matchesCache[state.league],
    status: state.status,
    error: state.error,
    changeLeague,
    refetch,
  };
}
