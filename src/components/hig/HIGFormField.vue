<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  optional?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="
      cn(
        'bg-hig-surface flex flex-col gap-2 rounded-[var(--hig-token-radius-sm)] p-4',
        'shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-hig-separator)_80%,transparent)]',
        'transition-shadow duration-150 ease-out',
        props.class
      )
    "
  >
    <header v-if="$slots.label || optional || $slots.trailing" class="flex flex-wrap items-baseline gap-2">
      <div v-if="$slots.label" class="text-[1rem] font-medium"><slot name="label" /></div>
      <span v-if="optional" class="text-hig-label-tertiary text-[0.85rem]">Opcjonalne</span>
      <div v-if="$slots.trailing" class="text-hig-label-secondary ml-auto text-[0.9rem]">
        <slot name="trailing" />
      </div>
    </header>
    <p v-if="$slots.description" class="text-hig-label-tertiary text-[0.9rem]">
      <slot name="description" />
    </p>
    <div v-if="$slots.accessory" class="text-hig-label-secondary text-[0.95rem]">
      <slot name="accessory" />
    </div>
    <div class="space-y-3"><slot /></div>
    <p v-if="$slots.error" class="text-hig-danger text-[0.85rem]"><slot name="error" /></p>
  </div>
</template>
