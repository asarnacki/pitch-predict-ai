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

const handleSave = (matchId: string, note: string | null, choice: UserChoice | null) => {
  emit("save", matchId, note, choice);
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
    <p class="text-muted-foreground text-sm sm:text-base">{{ t.predictions.ui.clickToGenerate }}</p>
  </div>

  <div v-else-if="predictionState.status === 'loading'" class="flex flex-col items-center justify-center gap-4 py-12">
    <Spinner class="text-primary h-8 w-8 sm:h-10 sm:w-10" />
    <p class="text-muted-foreground text-sm sm:text-base">{{ t.predictions.ui.generating }}</p>
  </div>

  <div v-else-if="predictionState.status === 'error'" class="py-8 text-center">
    <div class="mx-auto max-w-md space-y-3">
      <div class="text-destructive text-sm font-medium sm:text-base">{{ t.predictions.ui.errorTitle }}</div>
      <p class="text-muted-foreground text-xs sm:text-sm">
        {{ predictionState.error || t.predictions.errors.generateFailed }}
      </p>
      <p class="text-muted-foreground mt-4 text-xs">{{ t.predictions.ui.retryHint }}</p>
    </div>
  </div>

  <div v-else-if="predictionState.status === 'success' && predictionState.data" class="space-y-6">
    <div>
      <h4 class="mb-2 text-base font-semibold sm:text-lg">{{ t.predictions.ui.aiTitle }}</h4>
      <p class="text-muted-foreground mb-4 text-xs sm:text-sm">{{ t.predictions.ui.selectHint }}</p>
      <BarChart
        :prediction="predictionState.data.prediction"
        :home-team="predictionState.data.home_team"
        :away-team="predictionState.data.away_team"
        :interactive="true"
        :selected-choice="userChoice"
        @choice-select="handleChoiceSelect"
      />
    </div>

    <div class="text-muted-foreground text-center text-xs sm:text-left sm:text-sm">
      {{ t.predictions.ui.generatedAt }} {{ formattedGeneratedDate }}
    </div>

    <SavePredictionForm
      ref="formRef"
      :match-id="match.id"
      :save-status="predictionState.saveStatus"
      :is-authenticated="isAuthenticated"
      @save="handleSave"
    />
  </div>
</template>
