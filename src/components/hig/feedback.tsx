import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

type FeedbackTone = "informative" | "success" | "warning" | "destructive"

const TONE_TO_COLOR: Record<FeedbackTone, { base: string; text: string }> = {
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
}

const TONE_PILL: Record<FeedbackTone, string> = {
  informative: "bg-[color:var(--hig-color-tint)]",
  success: "bg-[color:var(--hig-color-success)]",
  warning: "bg-[color:var(--hig-color-neutral)]",
  destructive: "bg-[color:var(--hig-color-danger)]",
}

export interface HIGFeedbackBannerProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  tone?: FeedbackTone
  title?: ReactNode
}

export const HIGFeedbackBanner = ({
  actions,
  className,
  description,
  icon,
  tone = "informative",
  title,
  ...props
}: HIGFeedbackBannerProps) => {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-3 rounded-[var(--hig-token-radius)] px-4 py-3",
        "ring-1 ring-[color:var(--hig-color-separator)] shadow-[var(--hig-token-shadow)]",
        TONE_TO_COLOR[tone].base,
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              TONE_PILL[tone],
              "text-white/95",
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-[color:var(--hig-color-label-primary)]">
          {title ? <div className="text-[1.05rem] font-semibold">{title}</div> : null}
          {description ? (
            <p className="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

HIGFeedbackBanner.displayName = "HIGFeedbackBanner"

export interface HIGBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: FeedbackTone
  icon?: ReactNode
}

export const HIGBadge = ({ className, children, icon, tone = "informative", ...props }: HIGBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.8rem] font-medium",
        "tracking-[0.06em] uppercase text-[color:var(--hig-color-tint-foreground)]",
        TONE_PILL[tone],
        className,
      )}
      {...props}
    >
      {icon ? <span className="grid h-4 w-4 place-items-center">{icon}</span> : null}
      {children}
    </span>
  )
}

HIGBadge.displayName = "HIGBadge"


