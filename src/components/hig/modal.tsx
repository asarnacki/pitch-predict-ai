import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { HIGButton } from "./button";
import { useTranslation } from "@/lib/i18n";

export interface HIGModalAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export interface HIGModalProps {
  actions?: {
    primary?: HIGModalAction;
    secondary?: HIGModalAction;
    tertiary?: HIGModalAction;
  };
  description?: ReactNode;
  dismissible?: boolean;
  onClose: () => void;
  open: boolean;
  title?: ReactNode;
  width?: "sm" | "md" | "lg";
  children?: ReactNode;
}

const WIDTH_STYLES: Record<NonNullable<HIGModalProps["width"]>, string> = {
  sm: "max-w-[22rem]",
  md: "max-w-[32rem]",
  lg: "max-w-[42rem]",
};

export const HIGModal = ({
  actions,
  children,
  description,
  dismissible = true,
  onClose,
  open,
  title,
  width = "md",
}: HIGModalProps) => {
  const t = useTranslation();
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [dismissible, onClose, open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const modalNode = modalRef.current;

    const focusableSelectors = ["button", "[href]", "input", "select", "textarea", "[tabindex]:not([tabindex='-1'])"];

    const focusable = modalNode?.querySelector<HTMLElement>(focusableSelectors.join(","));

    focusable?.focus({ preventScroll: true });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open]);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }
    return document.body;
  }, []);

  if (!mounted || !portalTarget || !open) {
    return null;
  }

  const handleOverlayClick = () => {
    if (!dismissible) return;
    onClose();
  };

  const handleOverlayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!dismissible) return;

    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      onClose();
    }
  };

  const renderAction = (action?: HIGModalAction, priority: "primary" | "secondary" | "tertiary") => {
    if (!action) return null;

    const variant = action.destructive
      ? "destructive"
      : priority === "primary"
        ? "prominent"
        : priority === "secondary"
          ? "standard"
          : "plain";

    return (
      <HIGButton
        key={`${priority}-${action.label}`}
        variant={variant}
        onClick={action.onPress}
        loading={action.loading}
      >
        {action.label}
      </HIGButton>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" role="presentation">
      <div
        className="absolute inset-0 bg-[color:color-mix(in_oklch,var(--hig-color-surface)_70%,black)]/40 backdrop-blur-[length:var(--hig-token-blur)]"
        onClick={handleOverlayClick}
        role="button"
        tabIndex={dismissible ? 0 : -1}
        onKeyDown={handleOverlayKeyDown}
        aria-label={t.common.closeModalOverlayAria}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "relative z-[1] flex w-full flex-col gap-4 rounded-[var(--hig-token-radius-lg)]",
          "bg-[color:var(--hig-color-surface)] px-6 py-5 text-[color:var(--hig-color-label-primary)]",
          "shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]",
          WIDTH_STYLES[width]
        )}
      >
        {dismissible ? (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--hig-color-label-tertiary)] transition hover:bg-[color:color-mix(in_oklch,var(--hig-color-label-tertiary)_10%,transparent)]"
            aria-label={t.common.closeAria}
          >
            <span className="text-[1.1rem] leading-none">×</span>
          </button>
        ) : null}

        {title ? (
          <div className="pr-8 text-[1.35rem] font-semibold leading-tight text-[color:var(--hig-color-label-primary)]">
            {title}
          </div>
        ) : null}

        {description ? (
          <div className="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">{description}</div>
        ) : null}

        {children ? <div className="text-[0.98rem] leading-[1.5]">{children}</div> : null}

        {actions ? (
          <div className="mt-2 flex flex-wrap gap-2 self-end">
            {renderAction(actions.tertiary, "tertiary")}
            {renderAction(actions.secondary, "secondary")}
            {renderAction(actions.primary, "primary")}
          </div>
        ) : null}
      </div>
    </div>,
    portalTarget
  );
};
