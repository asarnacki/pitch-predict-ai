<script setup lang="ts">
import { Button } from "@/components/ui/button";

defineProps<{
  title: string;
  description: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
    <div class="max-w-md space-y-4 text-center">
      <h3 class="text-xl font-semibold sm:text-2xl">{{ title }}</h3>
      <p class="text-muted-foreground text-sm sm:text-base">{{ description }}</p>
      <Button v-if="actionLabel" variant="default" class="mt-2" @click="emit('action')">
        {{ actionLabel }}
      </Button>
    </div>
  </div>
</template>
