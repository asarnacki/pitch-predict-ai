export type FeedbackTone = "informative" | "success" | "warning" | "destructive";

export const TONE_TO_COLOR: Record<FeedbackTone, { base: string; text: string }> = {
  informative: {
    base: "bg-[color:color-mix(in_oklch,var(--color-hig-tint)_20%,transparent)]",
    text: "text-hig-label-primary",
  },
  success: {
    base: "bg-[color:color-mix(in_oklch,var(--color-hig-success)_18%,transparent)]",
    text: "text-hig-label-primary",
  },
  warning: {
    base: "bg-[color:color-mix(in_oklch,var(--color-hig-neutral)_22%,transparent)]",
    text: "text-hig-label-primary",
  },
  destructive: {
    base: "bg-[color:color-mix(in_oklch,var(--color-hig-danger)_22%,transparent)]",
    text: "text-hig-label-primary",
  },
};

export const TONE_PILL: Record<FeedbackTone, string> = {
  informative: "bg-hig-tint",
  success: "bg-hig-success",
  warning: "bg-hig-neutral",
  destructive: "bg-hig-danger",
};
