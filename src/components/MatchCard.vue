<script setup lang="ts">
import { computed } from "vue";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import PredictionResult from "./PredictionResult.vue";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";
import { useLanguage } from "@/lib/i18n";

const props = defineProps<{
  match: MatchDTO;
  predictionState?: PredictionState;
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  save: [matchId: string, note: string | null, userChoice: UserChoice | null];
}>();

const { language } = useLanguage();
const locale = computed(() => (language.value === "pl" ? "pl-PL" : "en-US"));
const matchDate = computed(() => new Date(props.match.match_date));
const formattedDate = computed(() =>
  matchDate.value.toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
);
const formattedTime = computed(() =>
  matchDate.value.toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  })
);
</script>

<template>
  <AccordionItem :value="match.id" class="border rounded-lg overflow-hidden bg-card">
    <AccordionTrigger
      class="px-4 sm:px-6 py-4 sm:py-5 hover:bg-accent/50 transition-colors [&[data-state=open]]:bg-accent/30"
    >
      <div class="flex flex-col gap-3 w-full pr-2 sm:pr-4">
        <div class="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <span>{{ formattedDate }}</span>
          <span class="text-xs">•</span>
          <span>{{ formattedTime }}</span>
        </div>

        <div class="flex items-center justify-center gap-3 sm:gap-4">
          <div class="flex items-center gap-2 flex-1 justify-end">
            <span class="font-semibold text-sm sm:text-base text-right truncate">{{ match.home_team.name }}</span>
            <img :src="match.home_team.logo" :alt="match.home_team.name" class="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
          </div>

          <span class="text-xs font-medium text-muted-foreground px-2">VS</span>

          <div class="flex items-center gap-2 flex-1 justify-start">
            <img :src="match.away_team.logo" :alt="match.away_team.name" class="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            <span class="font-semibold text-sm sm:text-base text-left truncate">{{ match.away_team.name }}</span>
          </div>
        </div>

        <div class="text-xs sm:text-sm text-muted-foreground text-center">{{ match.league }}</div>
      </div>
    </AccordionTrigger>
    <AccordionContent class="px-4 sm:px-6 py-4 sm:py-6 bg-accent/10">
      <PredictionResult
        :match="match"
        :prediction-state="predictionState"
        :is-authenticated="isAuthenticated"
        @save="(matchId, note, choice) => emit('save', matchId, note, choice)"
      />
    </AccordionContent>
  </AccordionItem>
</template>
