import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HIGCardProps extends HTMLAttributes<HTMLDivElement> {
  actions?: ReactNode;
  media?: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
  variant?: "translucent" | "solid";
}

export const HIGCard = forwardRef<HTMLDivElement, HIGCardProps>(
  ({ actions, children, className, media, subtitle, title, variant = "translucent", ...props }, ref) => {
    return (
      <article
        ref={ref}
        className={cn(
          "group relative isolate overflow-hidden rounded-[var(--hig-token-radius)]",
          "ring-1 ring-inset ring-[color:var(--hig-color-separator)]",
          "shadow-[var(--hig-token-shadow)]",
          variant === "translucent"
            ? "bg-[color:color-mix(in_oklch,var(--hig-color-surface-elevated)_60%,transparent)] backdrop-blur-[length:var(--hig-token-blur)]"
            : "bg-[color:var(--hig-color-surface)]",
          "transition-transform duration-200 ease-out hover:-translate-y-[2px]",
          className
        )}
        {...props}
      >
        {media ? (
          <div className="relative overflow-hidden">
            <div className="aspect-[16/9] w-full overflow-hidden">{media}</div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 px-5 py-5 text-[color:var(--hig-color-label-primary)]">
          {title ? <div className="text-[1.25rem] font-semibold leading-tight">{title}</div> : null}
          {subtitle ? (
            <div className="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">{subtitle}</div>
          ) : null}
          {children ? <div className="text-[1rem] text-[color:var(--hig-color-label-primary)]">{children}</div> : null}
          {actions ? (
            <div className="flex flex-wrap gap-2 pt-1 text-[color:var(--hig-color-label-primary)]">{actions}</div>
          ) : null}
        </div>
      </article>
    );
  }
);

HIGCard.displayName = "HIGCard";
