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
  <AccordionItem :value="match.id" class="bg-card overflow-hidden rounded-lg border">
    <AccordionTrigger
      class="hover:bg-accent/50 [&[data-state=open]]:bg-accent/30 px-4 py-4 transition-colors sm:px-6 sm:py-5"
    >
      <div class="flex w-full flex-col gap-3 pr-2 sm:pr-4">
        <div class="text-muted-foreground flex items-center justify-center gap-2 text-sm font-medium">
          <span>{{ formattedDate }}</span>
          <span class="text-xs">•</span>
          <span>{{ formattedTime }}</span>
        </div>

        <div class="flex items-center justify-center gap-3 sm:gap-4">
          <div class="flex flex-1 items-center justify-end gap-2">
            <span class="truncate text-right text-sm font-semibold sm:text-base">{{ match.home_team.name }}</span>
            <img :src="match.home_team.logo" :alt="match.home_team.name" class="h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8" />
          </div>

          <span class="text-muted-foreground px-2 text-xs font-medium">VS</span>

          <div class="flex flex-1 items-center justify-start gap-2">
            <img :src="match.away_team.logo" :alt="match.away_team.name" class="h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8" />
            <span class="truncate text-left text-sm font-semibold sm:text-base">{{ match.away_team.name }}</span>
          </div>
        </div>

        <div class="text-muted-foreground text-center text-xs sm:text-sm">{{ match.league }}</div>
      </div>
    </AccordionTrigger>
    <AccordionContent class="bg-accent/10 px-4 py-4 sm:px-6 sm:py-6">
      <PredictionResult
        :match="match"
        :prediction-state="predictionState"
        :is-authenticated="isAuthenticated"
        @save="(matchId, note, choice) => emit('save', matchId, note, choice)"
      />
    </AccordionContent>
  </AccordionItem>
</template>
