<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "translucent" | "solid";
  class?: HTMLAttributes["class"];
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
        'ring-1 ring-inset ring-[color:var(--hig-color-separator)]',
        'shadow-[var(--hig-token-shadow)]',
        props.variant === 'translucent'
          ? 'bg-[color:color-mix(in_oklch,var(--hig-color-surface-elevated)_60%,transparent)] backdrop-blur-[length:var(--hig-token-blur)]'
          : 'bg-[color:var(--hig-color-surface)]',
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

    <div class="flex flex-col gap-3 px-5 py-5 text-[color:var(--hig-color-label-primary)]">
      <div v-if="$slots.title" class="text-[1.25rem] font-semibold leading-tight"><slot name="title" /></div>
      <div v-if="$slots.subtitle" class="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">
        <slot name="subtitle" />
      </div>
      <div v-if="$slots.default" class="text-[1rem] text-[color:var(--hig-color-label-primary)]"><slot /></div>
      <div v-if="$slots.actions" class="flex flex-wrap gap-2 pt-1 text-[color:var(--hig-color-label-primary)]">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>
