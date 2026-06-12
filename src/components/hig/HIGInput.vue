<script setup lang="ts">
import { computed, useId, type HTMLAttributes } from "vue";
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
  class?: HTMLAttributes["class"];
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
  <div class="flex w-full flex-col gap-1.5 text-[color:var(--hig-color-label-primary)]">
    <label
      v-if="label"
      :for="inputId"
      class="flex items-center gap-2 text-[0.95rem] font-medium tracking-[0.01em] text-[color:var(--hig-color-label-primary)]"
    >
      <span>{{ label }}</span>
      <span v-if="optional && !required" class="text-[color:var(--hig-color-label-tertiary)]">(opcjonalne)</span>
    </label>

    <p v-if="description" :id="descriptionId" class="text-[0.9rem] text-[color:var(--hig-color-label-tertiary)]">
      {{ description }}
    </p>

    <div
      :class="
        cn(
          'group relative flex h-12 w-full items-center gap-3 rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)]',
          'px-4 text-[1rem] text-[color:var(--hig-color-label-primary)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--hig-color-separator)_80%,transparent)]',
          'focus-within:shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--hig-color-tint)_80%,transparent)]',
          'focus-within:ring-4 focus-within:ring-[color:color-mix(in_oklch,var(--hig-color-tint)_30%,transparent)]',
          'transition-shadow duration-150 ease-out',
          disabled && 'opacity-60',
          error && 'shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--hig-color-danger)_80%,transparent)]'
        )
      "
    >
      <span
        v-if="$slots.leadingVisual"
        class="flex h-5 w-5 items-center justify-center text-[color:var(--hig-color-label-secondary)]"
      >
        <slot name="leadingVisual" />
      </span>

      <input
        :id="inputId"
        v-model="modelValue"
        :class="
          cn(
            'flex-1 bg-transparent text-[color:inherit] placeholder:text-[color:var(--hig-color-label-tertiary)]',
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

      <span
        v-if="$slots.trailingVisual"
        class="flex h-5 w-5 items-center justify-center text-[color:var(--hig-color-label-tertiary)]"
      >
        <slot name="trailingVisual" />
      </span>
    </div>

    <p v-if="supportingText" :id="supportingTextId" class="text-[0.85rem] text-[color:var(--hig-color-label-tertiary)]">
      {{ supportingText }}
    </p>

    <p v-if="error" :id="errorId" class="text-[0.85rem] text-[color:var(--hig-color-danger)]">
      {{ error }}
    </p>
  </div>
</template>
