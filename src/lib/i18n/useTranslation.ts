import { computed, type ComputedRef } from "vue";
import { useLanguage } from "./language";
import { translations } from "./translations";
import type { Translation } from "./types";

export function useTranslation(): ComputedRef<Translation> {
  const { language } = useLanguage();
  return computed(() => translations[language.value]);
}
