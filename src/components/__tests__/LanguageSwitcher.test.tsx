import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { LanguageProvider } from "@/lib/i18n";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render the language switcher button", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toBeInTheDocument();
  });

  it("should show current language label", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toHaveTextContent(/Polski/i);
  });

  it("should change language when option selected", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher-trigger");

    // Initial state
    expect(button).toHaveTextContent(/Polski/i);

    // Open dropdown and select EN
    fireEvent.click(button);
    fireEvent.click(screen.getByTestId("language-option-en"));
    expect(button).toHaveTextContent(/English/i);

    // Open dropdown and select PL
    fireEvent.click(button);
    fireEvent.click(screen.getByTestId("language-option-pl"));
    expect(button).toHaveTextContent(/Polski/i);
  });

  it("should have proper aria attributes", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("should update aria-expanded when opened", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher-trigger");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
