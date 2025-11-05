import { forwardRef } from "react"
import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface HIGListProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

export interface HIGListSectionProps extends HTMLAttributes<HTMLDivElement> {
  footer?: ReactNode
  header?: ReactNode
}

export interface HIGListItemProps extends HTMLAttributes<HTMLDivElement> {
  accessory?: ReactNode
  avatar?: ReactNode
  context?: ReactNode
  detail?: ReactNode
  interactive?: boolean
  label?: ReactNode
  subtitle?: ReactNode
}

const ListRoot = forwardRef<HTMLDivElement, HIGListProps>(
  ({ children, className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-6", inset && "px-4", className)}
      {...props}
    >
      {children}
    </div>
  ),
)

ListRoot.displayName = "HIGList"

const ListSection = ({ children, className, footer, header, ...props }: HIGListSectionProps) => (
  <section className={cn("space-y-2", className)} {...props}>
    {header ? <div className="px-4 text-[0.85rem] uppercase tracking-[0.18em] text-[color:var(--hig-color-label-tertiary)]">{header}</div> : null}
    <div className="overflow-hidden rounded-[var(--hig-token-radius-sm)] bg-[color:var(--hig-color-surface)] ring-1 ring-[color:var(--hig-color-separator)]">
      <div className="flex flex-col divide-y divide-[color:var(--hig-color-separator)]/60">{children}</div>
    </div>
    {footer ? <div className="px-4 text-[0.8rem] text-[color:var(--hig-color-label-tertiary)]">{footer}</div> : null}
  </section>
)

ListSection.displayName = "HIGListSection"

const ListItem = ({
  accessory,
  avatar,
  children,
  className,
  context,
  detail,
  interactive,
  label,
  subtitle,
  ...props
}: HIGListItemProps) => {
  const Component = interactive ? "button" : "div"

  return (
    <Component
      className={cn(
        "group flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left",
        interactive &&
          "transition-colors duration-150 ease-out hover:bg-[color:color-mix(in_oklch,var(--hig-color-surface-contrast)_80%,transparent)] focus-visible:outline-none focus-visible:bg-[color:color-mix(in_oklch,var(--hig-color-tint)_12%,transparent)]",
        className,
      )}
      {...(interactive ? { type: "button" as const } : {})}
      {...props}
    >
      {avatar ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--hig-color-surface-contrast)]">
          {avatar}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {label ? (
          <span className="truncate text-[1rem] font-medium text-[color:var(--hig-color-label-primary)]">
            {label}
          </span>
        ) : null}
        {subtitle ? (
          <span className="truncate text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
            {subtitle}
          </span>
        ) : null}
        {context ? (
          <span className="truncate text-[0.78rem] text-[color:var(--hig-color-label-tertiary)]">
            {context}
          </span>
        ) : null}
        {children}
      </div>
      {detail ? (
        <div className="ml-auto flex items-center gap-2 text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
          {detail}
        </div>
      ) : null}
      {accessory ? (
        <div className="ml-2 text-[color:var(--hig-color-label-tertiary)]">{accessory}</div>
      ) : null}
    </Component>
  )
}

ListItem.displayName = "HIGListItem"

export const HIGList = Object.assign(ListRoot, {
  Section: ListSection,
  Item: ListItem,
})


