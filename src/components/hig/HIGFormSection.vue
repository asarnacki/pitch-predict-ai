<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <section
    :class="
      cn(
        'flex flex-col gap-4 rounded-[var(--hig-token-radius-sm)] bg-[color:color-mix(in_oklch,var(--hig-color-surface)_70%,transparent)] p-4',
        'ring-1 ring-inset ring-[color:var(--hig-color-separator)]',
        props.class
      )
    "
  >
    <header v-if="$slots.title || $slots.supportingText" class="space-y-1">
      <div v-if="$slots.title" class="text-[1.05rem] font-semibold"><slot name="title" /></div>
      <p v-if="$slots.supportingText" class="text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
        <slot name="supportingText" />
      </p>
    </header>
    <div class="flex flex-col gap-3"><slot /></div>
  </section>
</template>
