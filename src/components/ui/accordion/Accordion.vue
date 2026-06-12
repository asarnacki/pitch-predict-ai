<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { AccordionRoot, useForwardPropsEmits, type AccordionRootEmits, type AccordionRootProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<AccordionRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<AccordionRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <AccordionRoot data-slot="accordion" v-bind="forwarded" :class="cn(props.class)">
    <slot />
  </AccordionRoot>
</template>
