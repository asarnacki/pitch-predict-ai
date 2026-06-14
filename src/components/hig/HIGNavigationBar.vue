<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  translucent?: boolean;
  sticky?: boolean;
  class?: string;
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
          ? 'bg-[color:color-mix(in_oklch,var(--color-hig-surface)_72%,transparent)] backdrop-blur-[length:calc(var(--hig-token-blur)/1.4)]'
          : 'bg-hig-surface',
        'ring-hig-separator ring-1',
        props.sticky && 'sticky top-0',
        props.class
      )
    "
  >
    <div class="text-hig-label-primary flex items-center gap-2"><slot name="leading" /></div>
    <div class="flex min-w-0 flex-1 flex-col">
      <span v-if="$slots.title" class="text-hig-label-primary truncate text-[1.1rem] font-semibold tracking-[-0.01em]">
        <slot name="title" />
      </span>
      <span v-if="$slots.subtitle" class="text-hig-label-secondary truncate text-[0.9rem]">
        <slot name="subtitle" />
      </span>
    </div>
    <div class="text-hig-label-primary flex items-center gap-2"><slot name="trailing" /></div>
  </header>
</template>
