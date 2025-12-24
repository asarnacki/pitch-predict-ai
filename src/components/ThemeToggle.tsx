import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useTranslation } from "@/lib/i18n";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const t = useTranslation();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t.common.toggleThemeAria}
      className="rounded-full"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
