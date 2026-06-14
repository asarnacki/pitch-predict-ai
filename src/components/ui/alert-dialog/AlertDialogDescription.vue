<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { AlertDialogDescription, useForwardProps, type AlertDialogDescriptionProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <AlertDialogDescription
    data-slot="alert-dialog-description"
    v-bind="forwarded"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
