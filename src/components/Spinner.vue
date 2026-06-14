<script setup lang="ts">
import { useTranslation } from "@/lib/i18n";

const props = defineProps<{ class?: string }>();
const t = useTranslation();
</script>

<template>
  <!-- Simple spinner component for loading states -->
  <div
    :class="`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${props.class ?? ''}`"
    role="status"
  >
    <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !border-0 !p-0 !whitespace-nowrap ![clip:rect(0,0,0,0)]">
      {{ t.common.loading }}
    </span>
  </div>
</template>
