import { computed, onMounted, ref, watch } from "vue";
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

  const fetchIfMissing = (targetLeague: LeagueCode) => {
    if (matchesCache.value[targetLeague] === null) {
      fetchMatches(targetLeague);
    }
  };

  // onMounted (not an immediate watch) so the initial fetch never runs during SSR.
  // Watching only `league` — the cache check lives in the callback body, not in the
  // watch source, which is what prevents the infinite refetch loop the React
  // useEffect version once had (fixed in fb1e5da).
  onMounted(() => fetchIfMissing(league.value));
  watch(league, (newLeague) => fetchIfMissing(newLeague));

  return {
    league,
    matches,
    status,
    error,
    changeLeague,
    refetch,
  };
}
