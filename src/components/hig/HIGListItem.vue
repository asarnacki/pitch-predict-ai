<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  interactive?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <component
    :is="props.interactive ? 'button' : 'div'"
    :type="props.interactive ? 'button' : undefined"
    :class="
      cn(
        'group flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left',
        props.interactive &&
          'transition-colors duration-150 ease-out hover:bg-[color:color-mix(in_oklch,var(--color-hig-surface-contrast)_80%,transparent)] focus-visible:bg-[color:color-mix(in_oklch,var(--color-hig-tint)_12%,transparent)] focus-visible:outline-none',
        props.class
      )
    "
  >
    <span
      v-if="$slots.avatar"
      class="bg-hig-surface-contrast flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      <slot name="avatar" />
    </span>
    <div class="flex min-w-0 flex-1 flex-col">
      <span v-if="$slots.label" class="text-hig-label-primary truncate text-[1rem] font-medium">
        <slot name="label" />
      </span>
      <span v-if="$slots.subtitle" class="text-hig-label-secondary truncate text-[0.9rem]">
        <slot name="subtitle" />
      </span>
      <span v-if="$slots.context" class="text-hig-label-tertiary truncate text-[0.78rem]">
        <slot name="context" />
      </span>
      <slot />
    </div>
    <div v-if="$slots.detail" class="text-hig-label-secondary ml-auto flex items-center gap-2 text-[0.9rem]">
      <slot name="detail" />
    </div>
    <div v-if="$slots.accessory" class="text-hig-label-tertiary ml-2">
      <slot name="accessory" />
    </div>
  </component>
</template>
