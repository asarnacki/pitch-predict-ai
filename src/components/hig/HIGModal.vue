<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import HIGButton from "./HIGButton.vue";
import { useTranslation } from "@/lib/i18n";

export interface HIGModalAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

interface Props {
  actions?: {
    primary?: HIGModalAction;
    secondary?: HIGModalAction;
    tertiary?: HIGModalAction;
  };
  dismissible?: boolean;
  open: boolean;
  width?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: true,
  width: "md",
  actions: undefined,
});

const emit = defineEmits<{ close: [] }>();

const t = useTranslation();
const modalRef = ref<HTMLDivElement | null>(null);

const WIDTH_STYLES: Record<NonNullable<Props["width"]>, string> = {
  sm: "max-w-[22rem]",
  md: "max-w-[32rem]",
  lg: "max-w-[42rem]",
};

const handleKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.dismissible) {
    event.stopPropagation();
    emit("close");
  }
};

let previouslyFocused: HTMLElement | null = null;
let originalOverflow = "";

watch(
  () => props.open,
  (open) => {
    if (typeof document === "undefined") return;

    if (open) {
      document.addEventListener("keydown", handleKey);
      previouslyFocused = document.activeElement as HTMLElement | null;
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Wait for the teleported content to mount before focusing
      requestAnimationFrame(() => {
        const focusableSelectors = [
          "button",
          "[href]",
          "input",
          "select",
          "textarea",
          "[tabindex]:not([tabindex='-1'])",
        ];
        const focusable = modalRef.value?.querySelector<HTMLElement>(focusableSelectors.join(","));
        focusable?.focus({ preventScroll: true });
      });
    } else {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("keydown", handleKey);
  if (props.open) {
    document.body.style.overflow = originalOverflow;
  }
});

const handleOverlayClick = () => {
  if (!props.dismissible) return;
  emit("close");
};

const handleOverlayKeyDown = (event: KeyboardEvent) => {
  if (!props.dismissible) return;

  if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    emit("close");
  }
};

const actionVariant = (action: HIGModalAction, priority: "primary" | "secondary" | "tertiary") => {
  if (action.destructive) return "destructive";
  if (priority === "primary") return "prominent";
  if (priority === "secondary") return "standard";
  return "plain";
};
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center px-4" role="presentation">
      <div
        class="absolute inset-0 bg-[color:color-mix(in_oklch,var(--hig-color-surface)_70%,black)]/40 backdrop-blur-[length:var(--hig-token-blur)]"
        role="button"
        :tabindex="dismissible ? 0 : -1"
        :aria-label="t.common.closeModalOverlayAria"
        @click="handleOverlayClick"
        @keydown="handleOverlayKeyDown"
      />
      <div
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        :class="
          cn(
            'relative z-[1] flex w-full flex-col gap-4 rounded-[var(--hig-token-radius-lg)]',
            'bg-[color:var(--hig-color-surface)] px-6 py-5 text-[color:var(--hig-color-label-primary)]',
            'shadow-[var(--hig-token-shadow)] ring-1 ring-[color:var(--hig-color-separator)]',
            WIDTH_STYLES[width]
          )
        "
      >
        <button
          v-if="dismissible"
          class="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--hig-color-label-tertiary)] transition hover:bg-[color:color-mix(in_oklch,var(--hig-color-label-tertiary)_10%,transparent)]"
          :aria-label="t.common.closeAria"
          @click="emit('close')"
        >
          <span class="text-[1.1rem] leading-none">×</span>
        </button>

        <div
          v-if="$slots.title"
          class="pr-8 text-[1.35rem] font-semibold leading-tight text-[color:var(--hig-color-label-primary)]"
        >
          <slot name="title" />
        </div>

        <div v-if="$slots.description" class="text-[0.95rem] text-[color:var(--hig-color-label-secondary)]">
          <slot name="description" />
        </div>

        <div v-if="$slots.default" class="text-[0.98rem] leading-[1.5]"><slot /></div>

        <div v-if="actions" class="mt-2 flex flex-wrap gap-2 self-end">
          <template v-for="priority in ['tertiary', 'secondary', 'primary'] as const" :key="priority">
            <HIGButton
              v-if="actions[priority]"
              :variant="actionVariant(actions[priority]!, priority)"
              :loading="actions[priority]!.loading"
              @click="actions[priority]!.onPress()"
            >
              {{ actions[priority]!.label }}
            </HIGButton>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
