<script setup lang="ts">
defineProps<{ class?: string }>();
</script>

<template>
  <!-- Simple spinner component for loading states -->
  <div
    :class="`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${$props.class ?? ''}`"
    role="status"
  >
    <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
      Ładowanie...
    </span>
  </div>
</template>
