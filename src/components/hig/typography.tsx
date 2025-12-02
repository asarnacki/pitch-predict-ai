import { createElement } from "react";
import type { HTMLAttributes } from "react";

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

export interface HIGTypographyProps extends HTMLAttributes<HTMLElement> {
  align?: "start" | "center" | "end" | "justify";
  as?: keyof JSX.IntrinsicElements;
  tone?: HIGTone;
  variant?: HIGTypographyVariant;
  weight?: "regular" | "medium" | "semibold" | "bold";
}

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

const WEIGHT_STYLES: Record<NonNullable<HIGTypographyProps["weight"]>, string> = {
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

const DEFAULT_ELEMENT: Record<HIGTypographyVariant, keyof JSX.IntrinsicElements> = {
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

export const HIGTypography = ({
  align = "start",
  as,
  className,
  tone = "primary",
  variant = "body",
  weight = "regular",
  ...props
}: HIGTypographyProps) => {
  const element = as ?? DEFAULT_ELEMENT[variant];

  return createElement(element, {
    className: cn(
      "antialiased",
      VARIANT_STYLES[variant],
      WEIGHT_STYLES[weight],
      TONE_STYLES[tone],
      align === "center" && "text-center",
      align === "end" && "text-right",
      align === "justify" && "text-justify",
      className
    ),
    ...props,
  });
};
