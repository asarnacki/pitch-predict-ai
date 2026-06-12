import { computed, ref } from "vue";
import { matchesService, type LeagueCode } from "@/services/api/matches.service";
import type { MatchDTO } from "@/types";
import { ApiError } from "@/services/api/client";
import { useTranslation } from "@/lib/i18n";

export function useMatches(initialLeague: LeagueCode = "PREMIER_LEAGUE") {
  const t = useTranslation();

  const league = ref<LeagueCode>(initialLeague);
  const matchesCache = ref<Record<LeagueCode, MatchDTO[] | null>>({
    PREMIER_LEAGUE: null,
    LA_LIGA: null,
    BUNDESLIGA: null,
    WC: null,
  });
  const status = ref<"idle" | "loading" | "success" | "error">("idle");
  const error = ref<string | null>(null);

  const matches = computed(() => matchesCache.value[league.value] ?? []);

  const fetchMatches = async (targetLeague: LeagueCode) => {
    status.value = "loading";
    error.value = null;

    try {
      const fetched = await matchesService.fetchMatches(targetLeague, 5);

      matchesCache.value[targetLeague] = fetched;
      status.value = "success";
      error.value = null;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : t.value.predictions.errors.fetchMatchesFailed;

      status.value = "error";
      error.value = errorMessage;
    }
  };

  const changeLeague = (newLeague: LeagueCode) => {
    league.value = newLeague;
  };

  const refetch = () => {
    fetchMatches(league.value);
  };

  // TODO(human): trigger fetching matches reactively.
  //
  // The React version used a useEffect that ran on every state change and called
  // fetchMatches(league) when matchesCache[league] === null && status !== "loading".
  // That effect once caused an infinite refetch loop (fixed in commit fb1e5da).
  //
  // Implement the Vue equivalent here so that:
  //  - matches are fetched for the initial league when the component mounts (also on
  //    the very first render — this composable is only used client-side),
  //  - switching to a league that has not been fetched yet (cache is null) triggers a fetch,
  //  - switching back to an already-fetched league does NOT refetch (cache hit),
  //  - a league whose fetch failed can be retried via the existing refetch().

  return {
    league,
    matches,
    status,
    error,
    changeLeague,
    refetch,
  };
}
