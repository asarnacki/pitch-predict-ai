<script setup lang="ts">
import { computed, useId } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  description?: string;
  error?: string;
  label?: string;
  optional?: boolean;
  supportingText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  class?: string;
}

const props = defineProps<Props>();
const modelValue = defineModel<string | number>();

const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const descriptionId = computed(() => (props.description ? `${inputId.value}-description` : undefined));
const supportingTextId = computed(() => (props.supportingText ? `${inputId.value}-support` : undefined));
const errorId = computed(() => (props.error ? `${inputId.value}-error` : undefined));

const ariaDescribedBy = computed(() =>
  [descriptionId.value, supportingTextId.value, errorId.value].filter(Boolean).join(" ")
);
</script>

<template>
  <div class="text-hig-label-primary flex w-full flex-col gap-1.5">
    <label
      v-if="label"
      :for="inputId"
      class="text-hig-label-primary flex items-center gap-2 text-[0.95rem] font-medium tracking-[0.01em]"
    >
      <span>{{ label }}</span>
      <span v-if="optional && !required" class="text-hig-label-tertiary">(opcjonalne)</span>
    </label>

    <p v-if="description" :id="descriptionId" class="text-hig-label-tertiary text-[0.9rem]">
      {{ description }}
    </p>

    <div
      :class="
        cn(
          'group bg-hig-surface relative flex h-12 w-full items-center gap-3 rounded-[var(--hig-token-radius-sm)]',
          'text-hig-label-primary px-4 text-[1rem] shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-hig-separator)_80%,transparent)]',
          'focus-within:shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--color-hig-tint)_80%,transparent)]',
          'focus-within:ring-4 focus-within:ring-[color:color-mix(in_oklch,var(--color-hig-tint)_30%,transparent)]',
          'transition-shadow duration-150 ease-out',
          disabled && 'opacity-60',
          error && 'shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--color-hig-danger)_80%,transparent)]'
        )
      "
    >
      <span v-if="$slots.leadingVisual" class="text-hig-label-secondary flex h-5 w-5 items-center justify-center">
        <slot name="leadingVisual" />
      </span>

      <input
        :id="inputId"
        v-model="modelValue"
        :class="
          cn(
            'placeholder:text-hig-label-tertiary flex-1 bg-transparent text-[color:inherit]',
            'autofill:bg-transparent autofill:shadow-[0_0_0px_1000px_color:transparent]',
            'outline-none',
            props.class
          )
        "
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="Boolean(error) || undefined"
        :disabled="disabled"
        :required="required"
      />

      <span v-if="$slots.trailingVisual" class="text-hig-label-tertiary flex h-5 w-5 items-center justify-center">
        <slot name="trailingVisual" />
      </span>
    </div>

    <p v-if="supportingText" :id="supportingTextId" class="text-hig-label-tertiary text-[0.85rem]">
      {{ supportingText }}
    </p>

    <p v-if="error" :id="errorId" class="text-hig-danger text-[0.85rem]">
      {{ error }}
    </p>
  </div>
</template>
