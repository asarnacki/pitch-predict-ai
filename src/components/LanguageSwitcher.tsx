import { Languages } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      aria-label={`Switch language to ${language === "pl" ? "English" : "Polski"}`}
      className="rounded-full relative"
      data-testid="language-switcher"
    >
      <Languages className="size-5" />
      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold uppercase bg-primary text-primary-foreground px-1 rounded">
        {language}
      </span>
    </Button>
  );
}
