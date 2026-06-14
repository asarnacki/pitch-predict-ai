import { ref } from "vue";
import type { Language } from "./types";

const LANGUAGE_STORAGE_KEY = "pitchpredict-language";

function getInitialLanguage(): Language {
  // Check if we're in the browser
  if (typeof window === "undefined") {
    return "pl"; // Default to Polish on server
  }

  // Try to get from localStorage
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "pl" || stored === "en") {
    return stored;
  }

  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("pl")) {
    return "pl";
  }

  // Default to Polish
  return "pl";
}

// Module-level ref: ES modules are shared across Astro islands, so this is a
// natural reactive singleton (each `client:*` island is a separate Vue app).
const language = ref<Language>(getInitialLanguage());

if (typeof window !== "undefined") {
  document.documentElement.lang = language.value;
}

export function setLanguage(lang: Language) {
  if (language.value === lang) return;

  language.value = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
}

export function toggleLanguage() {
  setLanguage(language.value === "pl" ? "en" : "pl");
}

export function useLanguage() {
  return {
    language,
    setLanguage,
    toggleLanguage,
  };
}

/**
 * Test-only helpers.
 * The language state is module-level (singleton), so unit tests must be able to reset it.
 */
export const testing = {
  resetLanguage(lang: Language = "pl") {
    language.value = lang;

    if (typeof window !== "undefined") {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      document.documentElement.lang = lang;
    }
  },
};
