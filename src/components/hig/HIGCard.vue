<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  variant?: "translucent" | "solid";
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "translucent",
});
</script>

<template>
  <article
    :class="
      cn(
        'group relative isolate overflow-hidden rounded-[var(--hig-token-radius)]',
        'ring-hig-separator ring-1 ring-inset',
        'shadow-[var(--hig-token-shadow)]',
        props.variant === 'translucent'
          ? 'bg-[color:color-mix(in_oklch,var(--color-hig-surface-elevated)_60%,transparent)] backdrop-blur-[length:var(--hig-token-blur)]'
          : 'bg-hig-surface',
        'transition-transform duration-200 ease-out hover:-translate-y-[2px]',
        props.class
      )
    "
  >
    <div v-if="$slots.media" class="relative overflow-hidden">
      <div class="aspect-[16/9] w-full overflow-hidden"><slot name="media" /></div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]"
      />
    </div>

    <div class="text-hig-label-primary flex flex-col gap-3 px-5 py-5">
      <div v-if="$slots.title" class="text-[1.25rem] leading-tight font-semibold"><slot name="title" /></div>
      <div v-if="$slots.subtitle" class="text-hig-label-secondary text-[0.95rem]">
        <slot name="subtitle" />
      </div>
      <div v-if="$slots.default" class="text-hig-label-primary text-[1rem]"><slot /></div>
      <div v-if="$slots.actions" class="text-hig-label-primary flex flex-wrap gap-2 pt-1">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>
