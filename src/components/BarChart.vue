<script setup lang="ts">
import { computed } from "vue";
import type { PredictionProbabilities, UserChoice } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface Props {
  prediction: PredictionProbabilities;
  homeTeam: string;
  awayTeam: string;
  interactive?: boolean; // Default false - for display mode
  selectedChoice?: UserChoice | null; // Which bar is selected (for display mode)
}

const props = withDefaults(defineProps<Props>(), {
  interactive: false,
  selectedChoice: null,
});
const emit = defineEmits<{ choiceSelect: [choice: UserChoice] }>();

const t = useTranslation();

const handleBarClick = (choice: UserChoice) => {
  if (props.interactive) {
    emit("choiceSelect", choice);
  }
};

const handleBarKeyDown = (event: KeyboardEvent, choice: UserChoice) => {
  if (props.interactive && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    handleBarClick(choice);
  }
};

const getBarClasses = (choice: UserChoice, baseColor: string) => {
  const isSelected = props.selectedChoice === choice;
  const baseClasses = `h-full transition-all duration-150 ease-out rounded-full`;

  if (!props.interactive && !props.selectedChoice) {
    return `${baseClasses} ${baseColor}`;
  }

  if (isSelected) {
    // Selected bar - full opacity with subtle scale
    return `${baseClasses} ${baseColor} opacity-100 scale-y-105`;
  }

  // Unselected bar - dimmed
  return `${baseClasses} ${baseColor} opacity-40`;
};

const containerClasses = `h-3 sm:h-4 bg-secondary rounded-full overflow-visible relative transition-all duration-150`;

const getLabelClasses = (choice: UserChoice) => {
  const isSelected = props.selectedChoice === choice;
  const baseClasses = "font-medium text-xs sm:text-sm transition-all duration-150";

  if (!props.interactive && !props.selectedChoice) {
    return baseClasses;
  }

  return `${baseClasses} ${isSelected ? "font-bold" : "opacity-60"}`;
};

const getPercentageClasses = (choice: UserChoice, color: string) => {
  const isSelected = props.selectedChoice === choice;
  const baseClasses = `font-bold text-sm sm:text-base flex-shrink-0 transition-all duration-150 ${color}`;

  if (!props.interactive && !props.selectedChoice) {
    return baseClasses;
  }

  return `${baseClasses} ${isSelected ? "scale-110" : "opacity-60"}`;
};

// Get classes for the entire row container (handles both selected state and hover)
const getRowClasses = (choice: UserChoice) => {
  if (!props.interactive) return "";

  const isSelected = props.selectedChoice === choice;

  if (isSelected) {
    return "cursor-pointer border-2 border-primary rounded-lg bg-accent/5 shadow-sm transition-all duration-150";
  }

  return "cursor-pointer border-2 border-transparent rounded-lg hover:border-primary hover:bg-accent/10 hover:shadow-md hover:scale-[1.02] transition-all duration-150";
};

const rows = computed(() => [
  {
    choice: "home" as const,
    label: `${props.homeTeam} (${t.value.predictions.ui.chart.homeWin})`,
    truncate: true,
    percent: Math.round(props.prediction.home * 100),
    percentColor: "text-primary",
    barColor: "bg-primary",
  },
  {
    choice: "draw" as const,
    label: t.value.predictions.ui.chart.draw,
    truncate: false,
    percent: Math.round(props.prediction.draw * 100),
    percentColor: "text-blue-600 dark:text-blue-400",
    barColor: "bg-blue-600 dark:bg-blue-400",
  },
  {
    choice: "away" as const,
    label: `${props.awayTeam} (${t.value.predictions.ui.chart.awayWin})`,
    truncate: true,
    percent: Math.round(props.prediction.away * 100),
    percentColor: "text-green-600 dark:text-green-400",
    barColor: "bg-green-600 dark:bg-green-400",
  },
]);
</script>

<template>
  <div class="space-y-8 sm:space-y-9 lg:space-y-16">
    <div
      v-for="row in rows"
      :key="row.choice"
      :class="`-mx-2 my-4 space-y-2 p-2 ${getRowClasses(row.choice)}`"
      :role="interactive ? 'button' : undefined"
      :tabindex="interactive ? 0 : undefined"
      @click="handleBarClick(row.choice)"
      @keydown="handleBarKeyDown($event, row.choice)"
    >
      <div class="flex items-center justify-between gap-2">
        <span :class="`${getLabelClasses(row.choice)}${row.truncate ? 'truncate' : ''}`">{{ row.label }}</span>
        <span :class="getPercentageClasses(row.choice, row.percentColor)">{{ row.percent }}%</span>
      </div>
      <div :class="containerClasses">
        <div :class="getBarClasses(row.choice, row.barColor)" :style="{ width: `${row.percent}%` }" />
      </div>
    </div>
  </div>
</template>
