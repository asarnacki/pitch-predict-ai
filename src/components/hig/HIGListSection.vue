<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <section :class="cn('space-y-2', props.class)">
    <div v-if="$slots.header" class="text-hig-label-tertiary px-4 text-[0.85rem] tracking-[0.18em] uppercase">
      <slot name="header" />
    </div>
    <div class="bg-hig-surface ring-hig-separator overflow-hidden rounded-[var(--hig-token-radius-sm)] ring-1">
      <div class="flex flex-col divide-y divide-[color:var(--color-hig-separator)]/60"><slot /></div>
    </div>
    <div v-if="$slots.footer" class="text-hig-label-tertiary px-4 text-[0.8rem]">
      <slot name="footer" />
    </div>
  </section>
</template>
