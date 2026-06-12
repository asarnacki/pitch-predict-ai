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
  <div class="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
    <div class="max-w-md text-center space-y-4">
      <h3 class="text-xl sm:text-2xl font-semibold">{{ title }}</h3>
      <p class="text-sm sm:text-base text-muted-foreground">{{ description }}</p>
      <Button v-if="actionLabel" variant="default" class="mt-2" @click="emit('action')">
        {{ actionLabel }}
      </Button>
    </div>
  </div>
</template>
