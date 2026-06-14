<script setup lang="ts">
import { cn } from "@/lib/utils";
import { TONE_PILL, type FeedbackTone } from "./feedback-tones";

interface Props {
  tone?: FeedbackTone;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tone: "informative",
});
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.8rem] font-medium',
        'text-hig-tint-foreground tracking-[0.06em] uppercase',
        TONE_PILL[props.tone],
        props.class
      )
    "
  >
    <span v-if="$slots.icon" class="grid h-4 w-4 place-items-center"><slot name="icon" /></span>
    <slot />
  </span>
</template>
