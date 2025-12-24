import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/types";

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mark as hydrated for E2E stability (Astro islands can be visible before listeners are attached)
  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleLanguageChange = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="gap-2 px-2"
        data-testid="language-switcher-trigger"
        data-hydrated={hydrated ? "true" : "false"}
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden sm:inline-block text-sm font-medium">{currentLanguage.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 z-50">
          <div role="listbox" className="flex flex-col gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  language === lang.code && "bg-accent text-accent-foreground"
                )}
                role="option"
                aria-selected={language === lang.code}
                data-testid={`language-option-${lang.code}`}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {language === lang.code && <Check className="h-4 w-4" />}
                </span>
                <span className="mr-2 text-base">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
