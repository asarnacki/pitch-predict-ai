<script setup lang="ts">
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { HIGTabBarItem } from "./types";

interface Props {
  items: HIGTabBarItem[];
  activeKey: string;
  class?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ change: [key: string] }>();

const t = useTranslation();
</script>

<template>
  <nav
    :class="
      cn(
        'grid w-full grid-flow-col gap-1 rounded-[var(--hig-token-radius)] bg-[color:color-mix(in_oklch,var(--color-hig-surface)_70%,transparent)]',
        'text-hig-label-primary ring-hig-separator px-2 py-2 ring-1',
        props.class
      )
    "
    :aria-label="t.common.mainSectionsAria"
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      :class="
        cn(
          'flex flex-col items-center gap-1 rounded-[calc(var(--hig-token-radius)-0.5rem)] px-2 py-1.5 transition-colors',
          item.key === activeKey
            ? 'bg-hig-tint text-hig-tint-foreground shadow-[var(--hig-token-shadow)]'
            : 'text-hig-label-secondary hover:bg-[color:color-mix(in_oklch,var(--color-hig-surface-contrast)_80%,transparent)]'
        )
      "
      :aria-current="item.key === activeKey ? 'page' : undefined"
      @click="emit('change', item.key)"
    >
      <span class="grid h-6 w-6 place-items-center text-[1.1rem]"><slot name="icon" :item="item" /></span>
      <span class="text-[0.78rem] leading-none">{{ item.label }}</span>
    </button>
  </nav>
</template>
