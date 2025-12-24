import { LanguageProvider } from "@/lib/i18n";
import type { ReactNode } from "react";

interface LanguageProviderWrapperProps {
  children: ReactNode;
}

export function LanguageProviderWrapper({ children }: LanguageProviderWrapperProps) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
