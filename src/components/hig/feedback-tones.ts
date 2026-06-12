export type FeedbackTone = "informative" | "success" | "warning" | "destructive";

export const TONE_TO_COLOR: Record<FeedbackTone, { base: string; text: string }> = {
  informative: {
    base: "bg-[color:color-mix(in_oklch,var(--hig-color-tint)_20%,transparent)]",
    text: "text-[color:var(--hig-color-label-primary)]",
  },
  success: {
    base: "bg-[color:color-mix(in_oklch,var(--hig-color-success)_18%,transparent)]",
    text: "text-[color:var(--hig-color-label-primary)]",
  },
  warning: {
    base: "bg-[color:color-mix(in_oklch,var(--hig-color-neutral)_22%,transparent)]",
    text: "text-[color:var(--hig-color-label-primary)]",
  },
  destructive: {
    base: "bg-[color:color-mix(in_oklch,var(--hig-color-danger)_22%,transparent)]",
    text: "text-[color:var(--hig-color-label-primary)]",
  },
};

export const TONE_PILL: Record<FeedbackTone, string> = {
  informative: "bg-[color:var(--hig-color-tint)]",
  success: "bg-[color:var(--hig-color-success)]",
  warning: "bg-[color:var(--hig-color-neutral)]",
  destructive: "bg-[color:var(--hig-color-danger)]",
};
