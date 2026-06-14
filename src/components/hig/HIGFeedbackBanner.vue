<script setup lang="ts">
import { cn } from "@/lib/utils";
import { TONE_TO_COLOR, TONE_PILL, type FeedbackTone } from "./feedback-tones";

interface Props {
  tone?: FeedbackTone;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tone: "informative",
});
</script>

<template>
  <section
    :class="
      cn(
        'flex w-full flex-col gap-3 rounded-[var(--hig-token-radius)] px-4 py-3',
        'ring-hig-separator shadow-[var(--hig-token-shadow)] ring-1',
        TONE_TO_COLOR[props.tone].base,
        props.class
      )
    "
  >
    <div class="flex items-start gap-3">
      <span
        v-if="$slots.icon"
        :class="
          cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            TONE_PILL[props.tone],
            'text-white/95'
          )
        "
      >
        <slot name="icon" />
      </span>
      <div class="text-hig-label-primary flex min-w-0 flex-1 flex-col gap-1">
        <div v-if="$slots.title" class="text-[1.05rem] font-semibold"><slot name="title" /></div>
        <p v-if="$slots.description" class="text-hig-label-secondary text-[0.95rem]">
          <slot name="description" />
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </div>
  </section>
</template>
