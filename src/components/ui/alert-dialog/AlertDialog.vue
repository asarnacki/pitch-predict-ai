<script setup lang="ts">
import { AlertDialogRoot, useForwardPropsEmits, type AlertDialogEmits, type AlertDialogProps } from "reka-ui";

const props = defineProps<AlertDialogProps>();
const emits = defineEmits<AlertDialogEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AlertDialogRoot data-slot="alert-dialog" v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>
