<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  inset?: boolean;
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.inset && 'px-4', props.class)">
    <slot />
  </div>
</template>
