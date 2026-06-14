<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { ViewWidth } from "./types";

interface Props {
  width?: ViewWidth;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: "comfortable",
});

const WIDTH_CLASS: Record<ViewWidth, string> = {
  compact: "max-w-3xl",
  comfortable: "max-w-5xl",
  expanded: "max-w-7xl",
};
</script>

<template>
  <div class="bg-hig-surface flex min-h-screen flex-col">
    <slot name="navigationBar" />
    <div class="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div
        :class="
          cn(
            'relative flex w-full flex-1 gap-8',
            WIDTH_CLASS[props.width],
            $slots.sidebar ? 'lg:flex-row' : 'flex-col',
            'mx-auto'
          )
        "
      >
        <aside
          v-if="$slots.sidebar"
          class="bg-hig-surface-elevated text-hig-label-secondary ring-hig-separator sticky top-[5.5rem] hidden h-fit min-w-[16rem] shrink-0 rounded-[var(--hig-token-radius)] p-4 shadow-[var(--hig-token-shadow)] ring-1 lg:flex lg:flex-col lg:gap-4"
        >
          <slot name="sidebar" />
        </aside>
        <main
          :class="
            cn(
              'bg-hig-surface flex flex-1 flex-col gap-6 rounded-[var(--hig-token-radius)]',
              'ring-hig-separator shadow-[var(--hig-token-shadow)] ring-1',
              'p-6',
              props.class
            )
          "
        >
          <slot />
        </main>
      </div>
    </div>
    <div
      v-if="$slots.bottomBar"
      class="sticky bottom-0 flex w-full justify-center bg-[color:color-mix(in_oklch,var(--color-hig-surface)_72%,transparent)] px-4 py-3 backdrop-blur-[length:calc(var(--hig-token-blur)/1.8)]"
    >
      <div :class="cn('w-full', WIDTH_CLASS[props.width])"><slot name="bottomBar" /></div>
    </div>
  </div>
</template>
