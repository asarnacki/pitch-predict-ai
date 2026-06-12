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
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
      <header class="mb-8 sm:mb-12 text-center space-y-3">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{{ t.predictions.title }}</h1>
        <p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{{ t.predictions.subtitle }}</p>
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
