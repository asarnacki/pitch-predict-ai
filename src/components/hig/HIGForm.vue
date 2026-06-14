<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { Padding } from "./types";

interface Props {
  padding?: Padding;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  padding: "normal",
});

const PADDING_STYLES: Record<Padding, string> = {
  none: "gap-6",
  normal: "gap-6 px-6 py-6",
  compact: "gap-4 px-4 py-4",
};
</script>

<template>
  <form
    :class="
      cn(
        'bg-hig-surface flex w-full flex-col rounded-[var(--hig-token-radius)]',
        'ring-hig-separator shadow-[var(--hig-token-shadow)] ring-1',
        'text-hig-label-primary',
        PADDING_STYLES[props.padding],
        props.class
      )
    "
  >
    <div v-if="$slots.header" class="space-y-1 text-left"><slot name="header" /></div>
    <div class="flex flex-col gap-6"><slot /></div>
  </form>
</template>
