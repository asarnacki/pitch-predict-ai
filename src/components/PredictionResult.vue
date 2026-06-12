<script setup lang="ts">
import { computed, ref } from "vue";
import Spinner from "./Spinner.vue";
import BarChart from "./BarChart.vue";
import SavePredictionForm from "./SavePredictionForm.vue";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";
import { useLanguage, useTranslation } from "@/lib/i18n";

const props = defineProps<{
  match: MatchDTO;
  predictionState?: PredictionState;
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  save: [matchId: string, note: string | null, userChoice: UserChoice | null];
}>();

const userChoice = ref<UserChoice | null>(null);
const formRef = ref<InstanceType<typeof SavePredictionForm> | null>(null);
const t = useTranslation();
const { language } = useLanguage();

const handleChoiceSelect = (choice: UserChoice) => {
  const newChoice = userChoice.value === choice ? null : choice;
  userChoice.value = newChoice;

  formRef.value?.setUserChoice(newChoice);
};

const formattedGeneratedDate = computed(() => {
  if (!props.predictionState?.data) return "";

  const generatedDate = new Date(props.predictionState.data.generated_at);
  return generatedDate.toLocaleString(language.value === "pl" ? "pl-PL" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});
</script>

<template>
  <div v-if="!predictionState || predictionState.status === 'idle'" class="py-8 text-center">
    <p class="text-sm sm:text-base text-muted-foreground">{{ t.predictions.ui.clickToGenerate }}</p>
  </div>

  <div v-else-if="predictionState.status === 'loading'" class="py-12 flex flex-col items-center justify-center gap-4">
    <Spinner class="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
    <p class="text-sm sm:text-base text-muted-foreground">{{ t.predictions.ui.generating }}</p>
  </div>

  <div v-else-if="predictionState.status === 'error'" class="py-8 text-center">
    <div class="max-w-md mx-auto space-y-3">
      <div class="text-destructive font-medium text-sm sm:text-base">{{ t.predictions.ui.errorTitle }}</div>
      <p class="text-xs sm:text-sm text-muted-foreground">
        {{ predictionState.error || t.predictions.errors.generateFailed }}
      </p>
      <p class="text-xs text-muted-foreground mt-4">{{ t.predictions.ui.retryHint }}</p>
    </div>
  </div>

  <div v-else-if="predictionState.status === 'success' && predictionState.data" class="space-y-6">
    <div>
      <h4 class="text-base sm:text-lg font-semibold mb-2">{{ t.predictions.ui.aiTitle }}</h4>
      <p class="text-xs sm:text-sm text-muted-foreground mb-4">{{ t.predictions.ui.selectHint }}</p>
      <BarChart
        :prediction="predictionState.data.prediction"
        :home-team="predictionState.data.home_team"
        :away-team="predictionState.data.away_team"
        :interactive="true"
        :selected-choice="userChoice"
        @choice-select="handleChoiceSelect"
      />
    </div>

    <div class="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
      {{ t.predictions.ui.generatedAt }} {{ formattedGeneratedDate }}
    </div>

    <SavePredictionForm
      ref="formRef"
      :match-id="match.id"
      :save-status="predictionState.saveStatus"
      :is-authenticated="isAuthenticated"
      @save="(matchId, note, choice) => emit('save', matchId, note, choice)"
    />
  </div>
</template>
