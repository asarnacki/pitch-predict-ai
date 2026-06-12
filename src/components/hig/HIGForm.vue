<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

type Padding = "none" | "normal" | "compact";

interface Props {
  padding?: Padding;
  class?: HTMLAttributes["class"];
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
        'flex w-full flex-col rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface)]',
        'ring-1 ring-[color:var(--hig-color-separator)] shadow-[var(--hig-token-shadow)]',
        'text-[color:var(--hig-color-label-primary)]',
        PADDING_STYLES[props.padding],
        props.class
      )
    "
  >
    <div v-if="$slots.header" class="space-y-1 text-left"><slot name="header" /></div>
    <div class="flex flex-col gap-6"><slot /></div>
  </form>
</template>
