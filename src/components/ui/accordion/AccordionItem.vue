<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { AccordionItem, useForwardProps, type AccordionItemProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<AccordionItemProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionItem data-slot="accordion-item" v-bind="forwarded" :class="cn('border-b last:border-b-0', props.class)">
    <slot />
  </AccordionItem>
</template>
