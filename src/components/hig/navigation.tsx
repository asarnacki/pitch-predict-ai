import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface HIGNavigationBarProps extends HTMLAttributes<HTMLElement> {
  leading?: ReactNode
  subtitle?: ReactNode
  title?: ReactNode
  trailing?: ReactNode
  translucent?: boolean
  sticky?: boolean
}

export const HIGNavigationBar = ({
  className,
  leading,
  subtitle,
  title,
  trailing,
  translucent = true,
  sticky,
  ...props
}: HIGNavigationBarProps) => {
  return (
    <header
      className={cn(
        "relative z-30 flex w-full items-center gap-3 px-4 py-3",
        translucent
          ? "bg-[color:color-mix(in_oklch,var(--hig-color-surface)_72%,transparent)] backdrop-blur-[length:calc(var(--hig-token-blur)/1.4)]"
          : "bg-[color:var(--hig-color-surface)]",
        "ring-1 ring-[color:var(--hig-color-separator)]",
        sticky && "sticky top-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-[color:var(--hig-color-label-primary)]">
        {leading}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {title ? (
          <span className="truncate text-[1.1rem] font-semibold tracking-[-0.01em] text-[color:var(--hig-color-label-primary)]">
            {title}
          </span>
        ) : null}
        {subtitle ? (
          <span className="truncate text-[0.9rem] text-[color:var(--hig-color-label-secondary)]">
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-[color:var(--hig-color-label-primary)]">{trailing}</div>
    </header>
  )
}

HIGNavigationBar.displayName = "HIGNavigationBar"

export interface HIGTabBarProps extends HTMLAttributes<HTMLDivElement> {
  items: Array<{
    icon: ReactNode
    label: string
    key: string
  }>
  activeKey: string
  onChange: (key: string) => void
}

export const HIGTabBar = ({ activeKey, className, items, onChange, ...props }: HIGTabBarProps) => {
  return (
    <nav
      className={cn(
        "grid w-full grid-flow-col gap-1 rounded-[var(--hig-token-radius)] bg-[color:color-mix(in_oklch,var(--hig-color-surface)_70%,transparent)]",
        "px-2 py-2 text-[color:var(--hig-color-label-primary)] ring-1 ring-[color:var(--hig-color-separator)]",
        className,
      )}
      {...props}
      aria-label="Główne sekcje"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[calc(var(--hig-token-radius)-0.5rem)] px-2 py-1.5 transition-colors",
              isActive
                ? "bg-[color:var(--hig-color-tint)] text-[color:var(--hig-color-tint-foreground)] shadow-[var(--hig-token-shadow)]"
                : "text-[color:var(--hig-color-label-secondary)] hover:bg-[color:color-mix(in_oklch,var(--hig-color-surface-contrast)_80%,transparent)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="grid h-6 w-6 place-items-center text-[1.1rem]">{item.icon}</span>
            <span className="text-[0.78rem] leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

HIGTabBar.displayName = "HIGTabBar"


