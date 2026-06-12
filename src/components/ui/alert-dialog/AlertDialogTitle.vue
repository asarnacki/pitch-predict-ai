<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { AlertDialogTitle, useForwardProps, type AlertDialogTitleProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<AlertDialogTitleProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <AlertDialogTitle data-slot="alert-dialog-title" v-bind="forwarded" :class="cn('text-lg font-semibold', props.class)">
    <slot />
  </AlertDialogTitle>
</template>
