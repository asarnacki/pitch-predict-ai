import { forwardRef, useId } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface HIGInputProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: string
  error?: string
  label?: string
  leadingVisual?: ReactNode
  optional?: boolean
  supportingText?: string
  trailingVisual?: ReactNode
}

export const HIGInput = forwardRef<HTMLInputElement, HIGInputProps>(
  (
    {
      className,
      description,
      disabled,
      error,
      id,
      label,
      leadingVisual,
      optional,
      required,
      supportingText,
      trailingVisual,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const descriptionId = description ? `${inputId}-description` : undefined
    const supportingTextId = supportingText ? `${inputId}-support` : undefined
    const errorId = error ? `${inputId}-error` : undefined

    const ariaDescribedBy = [descriptionId, supportingTextId, errorId]
      .filter(Boolean)
      .join(" ")

    return (
      <div className="flex w-full flex-col gap-1.5 text-[color:var(--hig-color-label-primary)]">
        {label ? (
          <label
            htmlFor={inputId}
            className="flex items-center gap-2 text-[0.95rem] font-medium tracking-[0.01em] text-[color:var(--hig-color-label-primary)]"
          >
            <span>{label}</span>
            {optional && !required ? (
              <span className="text-[color:var(--hig-color-label-tertiary)]">(opcjonalne)</span>
            ) : null}
          </label>
        ) : null}

        {description ? (
          <p id={descriptionId} className="text-[0.9rem] text-[color:var(--hig-color-label-tertiary)]">
            {description}
          </p>
        ) : null}

        <div
          className={cn(
            "group relative flex h-12 w-full items-center gap-3 rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)]",
            "px-4 text-[1rem] text-[color:var(--hig-color-label-primary)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--hig-color-separator)_80%,transparent)]",
            "focus-within:shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--hig-color-tint)_80%,transparent)]",
            "focus-within:ring-4 focus-within:ring-[color:color-mix(in_oklch,var(--hig-color-tint)_30%,transparent)]",
            "transition-shadow duration-150 ease-out",
            disabled && "opacity-60",
            error && "shadow-[0_0_0_1.5px_color-mix(in_oklch,var(--hig-color-danger)_80%,transparent)]",
          )}
        >
          {leadingVisual ? (
            <span className="flex h-5 w-5 items-center justify-center text-[color:var(--hig-color-label-secondary)]">
              {leadingVisual}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent text-[color:inherit] placeholder:text-[color:var(--hig-color-label-tertiary)]",
              "autofill:bg-transparent autofill:shadow-[0_0_0px_1000px_color:transparent]",
              "outline-none",
              className,
            )}
            aria-describedby={ariaDescribedBy}
            aria-invalid={Boolean(error) || undefined}
            disabled={disabled}
            required={required}
            {...props}
          />

          {trailingVisual ? (
            <span className="flex h-5 w-5 items-center justify-center text-[color:var(--hig-color-label-tertiary)]">
              {trailingVisual}
            </span>
          ) : null}
        </div>

        {supportingText ? (
          <p
            id={supportingTextId}
            className="text-[0.85rem] text-[color:var(--hig-color-label-tertiary)]"
          >
            {supportingText}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} className="text-[0.85rem] text-[color:var(--hig-color-danger)]">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

HIGInput.displayName = "HIGInput"


