import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Language } from "./types";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    // Update html lang attribute
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const newLang: Language = language === "pl" ? "en" : "pl";
    setLanguage(newLang);
  };

  // Set initial lang attribute on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
