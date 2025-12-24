import { useEffect, useState, type ReactNode } from "react";
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

interface LanguageProviderProps {
  children: ReactNode;
}

// Singleton state to share across Astro islands (each `client:*` is a separate React root).
let currentLanguage: Language = "pl";
const listeners = new Set<(lang: Language) => void>();

// Initialize on client
if (typeof window !== "undefined") {
  currentLanguage = getInitialLanguage();
  document.documentElement.lang = currentLanguage;
}

const notify = () => {
  listeners.forEach((l) => l(currentLanguage));
};

const setLanguageGlobal = (lang: Language) => {
  if (currentLanguage === lang) return;

  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
  notify();
};

const toggleLanguageGlobal = () => {
  const newLang: Language = currentLanguage === "pl" ? "en" : "pl";
  setLanguageGlobal(newLang);
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

/**
 * Test-only helpers.
 * The language state is module-level (singleton), so unit tests must be able to reset it.
 */
export const __testing = {
  resetLanguage(lang: Language = "pl") {
    currentLanguage = lang;
    listeners.clear();

    if (typeof window !== "undefined") {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      document.documentElement.lang = lang;
    }
  },
};

export function useLanguage(): LanguageContextType {
  const [language, setLanguageState] = useState<Language>(currentLanguage);

  useEffect(() => {
    setLanguageState(currentLanguage);

    const listener = (lang: Language) => {
      setLanguageState(lang);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    language,
    setLanguage: setLanguageGlobal,
    toggleLanguage: toggleLanguageGlobal,
  };
}

/**
 * Backward compatible provider (no longer required).
 * Kept so existing tests/components can still wrap with it.
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  return <>{children}</>;
}
