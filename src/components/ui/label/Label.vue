<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Label as LabelPrimitive, type LabelProps } from "reka-ui";
import { cn } from "@/lib/utils";

interface Props extends LabelProps {
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <LabelPrimitive
    :for="props.for"
    :class="
      cn('text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.class)
    "
  >
    <slot />
  </LabelPrimitive>
</template>
