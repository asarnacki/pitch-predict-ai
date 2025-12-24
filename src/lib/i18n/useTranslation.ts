import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";
import type { Translation } from "./types";

export function useTranslation(): Translation {
  const { language } = useLanguage();
  return translations[language];
}
