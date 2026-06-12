<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  translucent?: boolean;
  sticky?: boolean;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  translucent: true,
});
</script>

<template>
  <header
    :class="
      cn(
        'relative z-30 flex w-full items-center gap-3 px-4 py-3',
        props.translucent
          ? 'bg-[color:color-mix(in_oklch,var(--hig-color-surface)_72%,transparent)] backdrop-blur-[length:calc(var(--hig-token-blur)/1.4)]'
          : 'bg-[color:var(--hig-color-surface)]',
        'ring-1 ring-[color:var(--hig-color-separator)]',
        props.sticky && 'sticky top-0',
        props.class
      )
    "
  >
    <div class="flex items-center gap-2 text-[color:var(--hig-color-label-primary)]"><slot name="leading" /></div>
    <div class="flex min-w-0 flex-1 flex-col">
      <span
        v-if="$slots.title"
        class="truncate text-[1.1rem] font-semibold tracking-[-0.01em] text-[color:var(--hig-color-label-primary)]"
      >
        <slot name="title" />
      </span>
      <span v-if="$slots.subtitle" class="truncate text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
        <slot name="subtitle" />
      </span>
    </div>
    <div class="flex items-center gap-2 text-[color:var(--hig-color-label-primary)]"><slot name="trailing" /></div>
  </header>
</template>
