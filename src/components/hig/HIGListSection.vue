<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <section :class="cn('space-y-2', props.class)">
    <div
      v-if="$slots.header"
      class="px-4 text-[0.85rem] uppercase tracking-[0.18em] text-[color:var(--hig-color-label-tertiary)]"
    >
      <slot name="header" />
    </div>
    <div
      class="overflow-hidden rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)] ring-1 ring-[color:var(--hig-color-separator)]"
    >
      <div class="flex flex-col divide-y divide-[color:var(--hig-color-separator)]/60"><slot /></div>
    </div>
    <div v-if="$slots.footer" class="px-4 text-[0.8rem] text-[color:var(--hig-color-label-tertiary)]">
      <slot name="footer" />
    </div>
  </section>
</template>
