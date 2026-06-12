<template>
  <section class="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
    <div
      class="rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface)] p-6 shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]"
    >
      <slot name="primary" />
    </div>
    <div
      class="rounded-[var(--hig-token-radius)] bg-[color:var(--hig-color-surface-elevated)] p-6 shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]"
    >
      <slot name="secondary" />
    </div>
  </section>
</template>
