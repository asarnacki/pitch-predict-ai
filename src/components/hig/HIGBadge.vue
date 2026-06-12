<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { TONE_PILL, type FeedbackTone } from "./feedback-tones";

interface Props {
  tone?: FeedbackTone;
  class?: HTMLAttributes["class"];
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
        'tracking-[0.06em] uppercase text-[color:var(--hig-color-tint-foreground)]',
        TONE_PILL[props.tone],
        props.class
      )
    "
  >
    <span v-if="$slots.icon" class="grid h-4 w-4 place-items-center"><slot name="icon" /></span>
    <slot />
  </span>
</template>
