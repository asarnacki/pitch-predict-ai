import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

type ViewWidth = "compact" | "comfortable" | "expanded"

const WIDTH_CLASS: Record<ViewWidth, string> = {
  compact: "max-w-3xl",
  comfortable: "max-w-5xl",
  expanded: "max-w-7xl",
}

export interface HIGPageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  bottomBar?: ReactNode
  navigationBar?: ReactNode
  sidebar?: ReactNode
  width?: ViewWidth
}

export const HIGPageLayout = ({
  bottomBar,
  children,
  className,
  navigationBar,
  sidebar,
  width = "comfortable",
  ...props
}: HIGPageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--hig-color-surface)]" {...props}>
      {navigationBar}
      <div className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <div
          className={cn(
            "relative flex w-full flex-1 gap-8",
            WIDTH_CLASS[width],
            sidebar ? "lg:flex-row" : "flex-col",
            "mx-auto",
          )}
        >
          {sidebar ? (
            <aside className="sticky top-[5.5rem] hidden h-fit min-w-[16rem] shrink-0 rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface-elevated)] p-4 text-[color:var(--hig-color-label-secondary)] shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)] lg:flex lg:flex-col lg:gap-4">
              {sidebar}
            </aside>
          ) : null}
          <main
            className={cn(
              "flex flex-1 flex-col gap-6 rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface)]",
              "ring-1 ring-[color:var(--hig-color-separator)] shadow-[var(--hig-token-shadow)]",
              "p-6",
              className,
            )}
          >
            {children}
          </main>
        </div>
      </div>
      {bottomBar ? (
        <div className="sticky bottom-0 flex w-full justify-center bg-[color:color-mix(in_oklch,var(--hig-color-surface)_72%,transparent)] px-4 py-3 backdrop-blur-[length:calc(var(--hig-token-blur)/1.8)]">
          <div className={cn("w-full", WIDTH_CLASS[width])}>{bottomBar}</div>
        </div>
      ) : null}
    </div>
  )
}

HIGPageLayout.displayName = "HIGPageLayout"

export interface HIGSplitViewProps {
  primary: ReactNode
  secondary: ReactNode
}

export const HIGSplitView = ({ primary, secondary }: HIGSplitViewProps) => {
  return (
    <section className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface)] p-6 shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]">
        {primary}
      </div>
      <div className="rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface-elevated)] p-6 shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]">
        {secondary}
      </div>
    </section>
  )
}

HIGSplitView.displayName = "HIGSplitView"


