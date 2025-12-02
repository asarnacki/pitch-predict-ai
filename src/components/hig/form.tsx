import { forwardRef } from "react";
import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HIGFormProps extends FormHTMLAttributes<HTMLFormElement> {
  header?: ReactNode;
  padding?: "none" | "normal" | "compact";
}

export interface HIGFormSectionProps extends HTMLAttributes<HTMLDivElement> {
  supportingText?: ReactNode;
  title?: ReactNode;
}

export interface HIGFormFieldProps extends HTMLAttributes<HTMLDivElement> {
  accessory?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  label?: ReactNode;
  optional?: boolean;
  trailing?: ReactNode;
}

const PADDING_STYLES: Record<NonNullable<HIGFormProps["padding"]>, string> = {
  none: "gap-6",
  normal: "gap-6 px-6 py-6",
  compact: "gap-4 px-4 py-4",
};

const FormRoot = forwardRef<HTMLFormElement, HIGFormProps>(
  ({ children, className, header, padding = "normal", ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(
          "flex w-full flex-col rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface)]",
          "ring-1 ring-[color:var(--hig-color-separator)] shadow-[var(--hig-token-shadow)]",
          "text-[color:var(--hig-color-label-primary)]",
          PADDING_STYLES[padding],
          className
        )}
        {...props}
      >
        {header ? <div className="space-y-1 text-left">{header}</div> : null}
        <div className="flex flex-col gap-6">{children}</div>
      </form>
    );
  }
);

FormRoot.displayName = "HIGForm";

const FormSection = ({ children, className, supportingText, title, ...props }: HIGFormSectionProps) => {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[var(--hig-token-radius-sm)] bg-[color:color-mix(in_oklch,var(--hig-color-surface)_70%,transparent)] p-4",
        "ring-1 ring-inset ring-[color:var(--hig-color-separator)]",
        className
      )}
      {...props}
    >
      {(title || supportingText) && (
        <header className="space-y-1">
          {title ? <div className="text-[1.05rem] font-semibold">{title}</div> : null}
          {supportingText ? (
            <p className="text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">{supportingText}</p>
          ) : null}
        </header>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
};

FormSection.displayName = "HIGFormSection";

const FormField = ({
  accessory,
  children,
  className,
  description,
  error,
  label,
  optional,
  trailing,
  ...props
}: HIGFormFieldProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)] p-4",
        "shadow-[0_0_0_1px_color-mix(in_oklch,var(--hig-color-separator)_80%,transparent)]",
        "transition-shadow duration-150 ease-out",
        className
      )}
      {...props}
    >
      {(label || optional || trailing) && (
        <header className="flex flex-wrap items-baseline gap-2">
          {label ? <div className="text-[1rem] font-medium">{label}</div> : null}
          {optional ? (
            <span className="text-[0.85rem] text-[color:var(--hig-color-label-tertiary)]">Opcjonalne</span>
          ) : null}
          {trailing ? (
            <div className="ml-auto text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">{trailing}</div>
          ) : null}
        </header>
      )}
      {description ? <p className="text-[0.9rem] text-[color:var(--hig-color-label-tertiary)]">{description}</p> : null}
      {accessory ? (
        <div className="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">{accessory}</div>
      ) : null}
      <div className="space-y-3">{children}</div>
      {error ? <p className="text-[0.85rem] text-[color:var(--hig-color-danger)]">{error}</p> : null}
    </div>
  );
};

FormField.displayName = "HIGFormField";

export const HIGForm = Object.assign(FormRoot, {
  Section: FormSection,
  Field: FormField,
});
