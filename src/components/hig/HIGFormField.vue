<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  optional?: boolean;
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col gap-2 rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)] p-4',
        'shadow-[0_0_0_1px_color-mix(in_oklch,var(--hig-color-separator)_80%,transparent)]',
        'transition-shadow duration-150 ease-out',
        props.class
      )
    "
  >
    <header v-if="$slots.label || optional || $slots.trailing" class="flex flex-wrap items-baseline gap-2">
      <div v-if="$slots.label" class="text-[1rem] font-medium"><slot name="label" /></div>
      <span v-if="optional" class="text-[0.85rem] text-[color:var(--hig-color-label-tertiary)]">Opcjonalne</span>
      <div v-if="$slots.trailing" class="ml-auto text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
        <slot name="trailing" />
      </div>
    </header>
    <p v-if="$slots.description" class="text-[0.9rem] text-[color:var(--hig-color-label-tertiary)]">
      <slot name="description" />
    </p>
    <div v-if="$slots.accessory" class="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">
      <slot name="accessory" />
    </div>
    <div class="space-y-3"><slot /></div>
    <p v-if="$slots.error" class="text-[0.85rem] text-[color:var(--hig-color-danger)]"><slot name="error" /></p>
  </div>
</template>
