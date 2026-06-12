<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

type HIGTypographyVariant =
  | "largeTitle"
  | "title1"
  | "title2"
  | "title3"
  | "headline"
  | "subheadline"
  | "callout"
  | "body"
  | "footnote"
  | "caption1"
  | "caption2";

type HIGTone = "primary" | "secondary" | "tertiary";

interface Props {
  align?: "start" | "center" | "end" | "justify";
  as?: string;
  tone?: HIGTone;
  variant?: HIGTypographyVariant;
  weight?: "regular" | "medium" | "semibold" | "bold";
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  align: "start",
  as: undefined,
  tone: "primary",
  variant: "body",
  weight: "regular",
});

const VARIANT_STYLES: Record<HIGTypographyVariant, string> = {
  largeTitle: "text-[2.75rem] leading-[1.05] tracking-[-0.01em]",
  title1: "text-[2.1rem] leading-[1.08] tracking-[-0.008em]",
  title2: "text-[1.75rem] leading-[1.1] tracking-[-0.006em]",
  title3: "text-[1.5rem] leading-[1.12]",
  headline: "text-[1.35rem] leading-[1.18]",
  subheadline: "text-[1.2rem] leading-[1.24]",
  callout: "text-[1.1rem] leading-[1.26]",
  body: "text-[1rem] leading-[1.4]",
  footnote: "text-[0.94rem] leading-[1.32]",
  caption1: "text-[0.86rem] leading-[1.28]",
  caption2: "text-[0.78rem] leading-[1.24]",
};

const WEIGHT_STYLES: Record<NonNullable<Props["weight"]>, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const TONE_STYLES: Record<HIGTone, string> = {
  primary: "text-[color:var(--hig-color-label-primary)]",
  secondary: "text-[color:var(--hig-color-label-secondary)]",
  tertiary: "text-[color:var(--hig-color-label-tertiary)]",
};

const DEFAULT_ELEMENT: Record<HIGTypographyVariant, string> = {
  largeTitle: "h1",
  title1: "h2",
  title2: "h3",
  title3: "h4",
  headline: "h5",
  subheadline: "h6",
  callout: "p",
  body: "p",
  footnote: "p",
  caption1: "span",
  caption2: "span",
};

const element = computed(() => props.as ?? DEFAULT_ELEMENT[props.variant]);
</script>

<template>
  <component
    :is="element"
    :class="
      cn(
        'antialiased',
        VARIANT_STYLES[props.variant],
        WEIGHT_STYLES[props.weight],
        TONE_STYLES[props.tone],
        props.align === 'center' && 'text-center',
        props.align === 'end' && 'text-right',
        props.align === 'justify' && 'text-justify',
        props.class
      )
    "
  >
    <slot />
  </component>
</template>
