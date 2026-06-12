<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  interactive?: boolean;
  class?: HTMLAttributes["class"];
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
          'transition-colors duration-150 ease-out hover:bg-[color:color-mix(in_oklch,var(--hig-color-surface-contrast)_80%,transparent)] focus-visible:outline-none focus-visible:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_12%,transparent)]',
        props.class
      )
    "
  >
    <span
      v-if="$slots.avatar"
      class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--hig-color-surface-contrast)]"
    >
      <slot name="avatar" />
    </span>
    <div class="flex min-w-0 flex-1 flex-col">
      <span v-if="$slots.label" class="truncate text-[1rem] font-medium text-[color:var(--hig-color-label-primary)]">
        <slot name="label" />
      </span>
      <span v-if="$slots.subtitle" class="truncate text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
        <slot name="subtitle" />
      </span>
      <span v-if="$slots.context" class="truncate text-[0.78rem] text-[color:var(--hig-color-label-tertiary)]">
        <slot name="context" />
      </span>
      <slot />
    </div>
    <div
      v-if="$slots.detail"
      class="ml-auto flex items-center gap-2 text-[0.9rem] text-[color:var(--hig-color-label-secondary)]"
    >
      <slot name="detail" />
    </div>
    <div v-if="$slots.accessory" class="ml-2 text-[color:var(--hig-color-label-tertiary)]">
      <slot name="accessory" />
    </div>
  </component>
</template>
