<script setup lang="ts">
import { computed } from "vue";
import { useMatches } from "./hooks/useMatches";
import { usePredictions } from "./hooks/usePredictions";
import LeagueSelector from "./LeagueSelector.vue";
import MatchList from "./MatchList.vue";
import EmptyState from "./EmptyState.vue";
import { useTranslation } from "@/lib/i18n";

withDefaults(defineProps<{ isAuthenticated?: boolean }>(), {
  isAuthenticated: false,
});

const t = useTranslation();
const {
  league,
  matches,
  status: matchesStatus,
  error: matchesError,
  changeLeague,
  refetch,
} = useMatches("PREMIER_LEAGUE");

const { predictions, generatePrediction, savePrediction } = usePredictions();

const isLoading = computed(() => matchesStatus.value === "loading");
const hasError = computed(() => matchesStatus.value === "error");
const hasMatches = computed(() => matches.value.length > 0);
</script>

<template>
  <div class="bg-background min-h-screen">
    <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <header class="mb-8 space-y-3 text-center sm:mb-12">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{{ t.predictions.title }}</h1>
        <p class="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg">{{ t.predictions.subtitle }}</p>
      </header>

      <LeagueSelector :selected-league="league" @league-change="changeLeague" />

      <EmptyState
        v-if="hasError"
        :title="t.predictions.errorTitle"
        :description="matchesError || t.predictions.errorDescription"
        :action-label="t.predictions.retryButton"
        @action="refetch"
      />
      <EmptyState
        v-else-if="!isLoading && !hasMatches"
        :title="t.predictions.noMatches"
        :description="t.predictions.noMatchesDescription"
      />
      <MatchList
        v-else
        :matches="matches"
        :is-loading="isLoading"
        :predictions-state="predictions"
        :is-authenticated="isAuthenticated"
        @generate-prediction="generatePrediction"
        @save-prediction="savePrediction"
      />
    </div>
  </div>
</template>
