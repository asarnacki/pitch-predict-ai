<script setup lang="ts">
import { ref } from "vue";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import MatchCard from "./MatchCard.vue";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";

const props = defineProps<{
  matches: MatchDTO[];
  isLoading: boolean;
  predictionsState: Record<string, PredictionState>;
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  generatePrediction: [match: MatchDTO];
  savePrediction: [matchId: string, note: string | null, userChoice: UserChoice | null];
}>();

const openedMatches = ref<Set<string>>(new Set());

const handleAccordionChange = (value: string | string[] | undefined) => {
  if (typeof value === "string" && value) {
    const match = props.matches.find((m) => m.id === value);
    if (match) {
      const predictionState = props.predictionsState[value];
      if (!openedMatches.value.has(value) || predictionState?.status === "error") {
        if (!predictionState || predictionState.status === "idle" || predictionState.status === "error") {
          emit("generatePrediction", match);
        }
        if (!openedMatches.value.has(value)) {
          openedMatches.value = new Set([...openedMatches.value, value]);
        }
      }
    }
  }
};
</script>

<template>
  <div v-if="isLoading" class="space-y-4">
    <div v-for="index in 5" :key="index" class="bg-card rounded-lg border p-4 sm:p-6">
      <div class="flex flex-col gap-3">
        <Skeleton class="mx-auto h-4 w-40" />
        <div class="flex items-center justify-center gap-4">
          <Skeleton class="h-5 w-24 sm:w-32" />
          <Skeleton class="h-6 w-6 rounded-full sm:h-8 sm:w-8" />
          <Skeleton class="h-3 w-8" />
          <Skeleton class="h-6 w-6 rounded-full sm:h-8 sm:w-8" />
          <Skeleton class="h-5 w-24 sm:w-32" />
        </div>
        <Skeleton class="mx-auto h-3 w-32" />
      </div>
    </div>
  </div>

  <Accordion v-else type="single" collapsible class="space-y-4" @update:model-value="handleAccordionChange">
    <MatchCard
      v-for="match in matches"
      :key="match.id"
      :match="match"
      :prediction-state="predictionsState[match.id]"
      :is-authenticated="isAuthenticated"
      @save="(matchId, note, choice) => emit('savePrediction', matchId, note, choice)"
    />
  </Accordion>
</template>
