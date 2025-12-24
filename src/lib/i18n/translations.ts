import type { Language, Translation } from "./types";
import pl from "./locales/pl.json";
import en from "./locales/en.json";

export const translations: Record<Language, Translation> = {
  pl,
  en,
};
