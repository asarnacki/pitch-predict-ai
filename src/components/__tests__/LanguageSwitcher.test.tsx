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

    const button = screen.getByTestId("language-switcher");
    expect(button).toBeInTheDocument();
  });

  it("should display current language badge", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher");
    // Should show "pl" badge initially
    expect(button).toHaveTextContent("pl");
  });

  it("should toggle language when clicked", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher");

    // Initial state
    expect(button).toHaveTextContent("pl");

    // Click to switch to EN
    fireEvent.click(button);
    expect(button).toHaveTextContent("en");

    // Click again to switch back to PL
    fireEvent.click(button);
    expect(button).toHaveTextContent("pl");
  });

  it("should have proper aria-label", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher");
    // Initial language is PL, so should show "Switch language to English"
    expect(button).toHaveAttribute("aria-label", "Switch language to English");
  });

  it("should update aria-label after language change", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByTestId("language-switcher");

    // Click to switch to EN
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-label", "Switch language to Polski");
  });
});
