<template>
  <section class="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
    <div
      class="bg-hig-surface ring-hig-separator rounded-[var(--hig-token-radius)] p-6 shadow-[var(--hig-token-shadow)] ring-1"
    >
      <slot name="primary" />
    </div>
    <div
      class="bg-hig-surface-elevated ring-hig-separator rounded-[var(--hig-token-radius)] p-6 shadow-[var(--hig-token-shadow)] ring-1"
    >
      <slot name="secondary" />
    </div>
  </section>
</template>
