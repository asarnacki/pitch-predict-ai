import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "prominent" | "standard" | "plain" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface HIGButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  iconPosition?: "leading" | "trailing";
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.9rem]",
  md: "h-11 px-4 text-[1rem]",
  lg: "h-12 px-5 text-[1.05rem]",
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  prominent:
    "bg-[color:var(--hig-color-tint)] text-[color:var(--hig-color-tint-foreground)] shadow-[var(--hig-token-shadow)] hover:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_92%,white)] active:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_88%,black)] disabled:bg-[color:var(--hig-color-tint-muted)]",
  standard:
    "bg-[color:var(--hig-color-surface-contrast)] text-[color:var(--hig-color-label-primary)] ring-1 ring-inset ring-[color:var(--hig-color-separator)] hover:bg-[color:color-mix(in_oklch,var(--hig-color-surface-contrast)_94%,var(--hig-color-tint)_6%)] active:bg-[color:color-mix(in_oklch,var(--hig-color-surface-contrast)_90%,black)]",
  plain:
    "bg-transparent text-[color:var(--hig-color-tint)] hover:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_8%,transparent)] active:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_12%,transparent)]",
  destructive:
    "bg-[color:var(--hig-color-danger)] text-[color:var(--hig-color-tint-foreground)] shadow-[var(--hig-token-shadow)] hover:bg-[color:color-mix(in_oklch,var(--hig-color-danger)_92%,white)] active:bg-[color:color-mix(in_oklch,var(--hig-color-danger)_88%,black)] disabled:bg-[color:color-mix(in_oklch,var(--hig-color-danger)_60%,white)]",
};

export const HIGButton = forwardRef<HTMLButtonElement, HIGButtonProps>(
  (
    {
      children,
      className,
      icon,
      iconPosition = "leading",
      loading = false,
      size = "md",
      variant = "standard",
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "font-medium tracking-[0.01em] transition-[background,box-shadow,transform] duration-150 ease-out",
          "inline-flex items-center justify-center gap-2 rounded-[var(--hig-token-radius-sm)]",
          "text-[color:var(--hig-color-label-primary)] disabled:opacity-60 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hig-color-tint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hig-color-surface)]",
          "active:translate-y-[1px]",
          SIZE_STYLES[size],
          VARIANT_STYLES[variant],
          className
        )}
        aria-busy={loading}
        disabled={isDisabled}
        {...props}
      >
        {icon && iconPosition === "leading" ? (
          <span
            className={cn("flex h-5 w-5 items-center justify-center text-[color:inherit]", loading && "opacity-0")}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}

        <span className={cn("relative", loading && "text-transparent")}>{children}</span>

        {loading ? (
          <span
            className="absolute inline-flex h-5 w-5 animate-spin items-center justify-center rounded-full border-[1.5px] border-[color:color-mix(in_oklch,var(--hig-color-tint)_60%,transparent)] border-t-[color:var(--hig-color-tint-foreground)]"
            aria-hidden
          />
        ) : null}

        {icon && iconPosition === "trailing" ? (
          <span className="flex h-5 w-5 items-center justify-center text-[color:inherit]" aria-hidden>
            {icon}
          </span>
        ) : null}
      </button>
    );
  }
);

HIGButton.displayName = "HIGButton";
