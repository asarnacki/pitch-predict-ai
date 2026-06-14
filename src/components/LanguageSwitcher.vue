<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import { Check, ChevronDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/types";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const { language, setLanguage } = useLanguage();
const isOpen = ref(false);
const hydrated = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
  // Mark as hydrated for E2E stability (Astro islands can be visible before listeners are attached)
  hydrated.value = true;
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

const currentLanguage = computed(() => LANGUAGES.find((l) => l.code === language.value) || LANGUAGES[0]);

const handleLanguageChange = (code: Language) => {
  setLanguage(code);
  isOpen.value = false;
};
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <Button
      variant="ghost"
      size="sm"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      class="gap-2 px-2"
      data-testid="language-switcher-trigger"
      :data-hydrated="hydrated ? 'true' : 'false'"
      @click="isOpen = !isOpen"
    >
      <span class="text-base">{{ currentLanguage.flag }}</span>
      <span class="hidden text-sm font-medium sm:inline-block">{{ currentLanguage.label }}</span>
      <ChevronDown :class="cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')" />
    </Button>

    <div
      v-if="isOpen"
      class="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full right-0 z-50 mt-2 w-40 rounded-md border p-1 shadow-md outline-none"
    >
      <div role="listbox" class="flex flex-col gap-1">
        <button
          v-for="lang in LANGUAGES"
          :key="lang.code"
          :class="
            cn(
              'hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
              language === lang.code && 'bg-accent text-accent-foreground'
            )
          "
          role="option"
          :aria-selected="language === lang.code"
          :data-testid="`language-option-${lang.code}`"
          @click="handleLanguageChange(lang.code)"
        >
          <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check v-if="language === lang.code" class="h-4 w-4" />
          </span>
          <span class="mr-2 text-base">{{ lang.flag }}</span>
          {{ lang.label }}
        </button>
      </div>
    </div>
  </div>
</template>
