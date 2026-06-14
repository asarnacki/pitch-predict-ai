<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { ButtonVariant, ButtonSize, IconPosition } from "./types";

interface Props {
  iconPosition?: IconPosition;
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  iconPosition: "leading",
  loading: false,
  size: "md",
  variant: "standard",
});

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.9rem]",
  md: "h-11 px-4 text-[1rem]",
  lg: "h-12 px-5 text-[1.05rem]",
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  prominent:
    "bg-hig-tint text-hig-tint-foreground shadow-[var(--hig-token-shadow)] hover:bg-[color:color-mix(in_oklch,var(--color-hig-tint)_92%,white)] active:bg-[color:color-mix(in_oklch,var(--color-hig-tint)_88%,black)] disabled:bg-hig-tint-muted",
  standard:
    "bg-hig-surface-contrast text-hig-label-primary ring-1 ring-inset ring-hig-separator hover:bg-[color:color-mix(in_oklch,var(--color-hig-surface-contrast)_94%,var(--color-hig-tint)_6%)] active:bg-[color:color-mix(in_oklch,var(--color-hig-surface-contrast)_90%,black)]",
  plain:
    "bg-transparent text-hig-tint hover:bg-[color:color-mix(in_oklch,var(--color-hig-tint)_8%,transparent)] active:bg-[color:color-mix(in_oklch,var(--color-hig-tint)_12%,transparent)]",
  destructive:
    "bg-hig-danger text-hig-tint-foreground shadow-[var(--hig-token-shadow)] hover:bg-[color:color-mix(in_oklch,var(--color-hig-danger)_92%,white)] active:bg-[color:color-mix(in_oklch,var(--color-hig-danger)_88%,black)] disabled:bg-[color:color-mix(in_oklch,var(--color-hig-danger)_60%,white)]",
};
</script>

<template>
  <button
    :class="
      cn(
        'font-medium tracking-[0.01em] transition-[background,box-shadow,transform] duration-150 ease-out',
        'inline-flex items-center justify-center gap-2 rounded-[var(--hig-token-radius-sm)]',
        'text-hig-label-primary disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:ring-hig-tint focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-hig-surface)] focus-visible:outline-none',
        'active:translate-y-[1px]',
        SIZE_STYLES[props.size],
        VARIANT_STYLES[props.variant],
        props.class
      )
    "
    :aria-busy="loading"
    :disabled="disabled || loading"
  >
    <span
      v-if="$slots.icon && iconPosition === 'leading'"
      :class="cn('flex h-5 w-5 items-center justify-center text-[color:inherit]', loading && 'opacity-0')"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>

    <span :class="cn('relative', loading && 'text-transparent')"><slot /></span>

    <span
      v-if="loading"
      class="absolute inline-flex h-5 w-5 animate-spin items-center justify-center rounded-full border-[1.5px] border-[color:color-mix(in_oklch,var(--color-hig-tint)_60%,transparent)] border-t-[color:var(--color-hig-tint-foreground)]"
      aria-hidden="true"
    />

    <span
      v-if="$slots.icon && iconPosition === 'trailing'"
      class="flex h-5 w-5 items-center justify-center text-[color:inherit]"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
  </button>
</template>
