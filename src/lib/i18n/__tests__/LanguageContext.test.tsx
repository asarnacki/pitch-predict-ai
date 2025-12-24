import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage, __testing } from "../LanguageContext";

// Test component that uses the language context
function TestComponent() {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <button data-testid="set-pl" onClick={() => setLanguage("pl")}>
        Set PL
      </button>
      <button data-testid="set-en" onClick={() => setLanguage("en")}>
        Set EN
      </button>
      <button data-testid="toggle" onClick={toggleLanguage}>
        Toggle
      </button>
    </div>
  );
}

describe("LanguageContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset HTML lang attribute
    document.documentElement.lang = "en";
    // Reset singleton
    __testing.resetLanguage("pl");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with default language (Polish)", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId("current-language")).toHaveTextContent("pl");
  });

  it("should change language using setLanguage", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const setEnButton = screen.getByTestId("set-en");
    fireEvent.click(setEnButton);

    expect(screen.getByTestId("current-language")).toHaveTextContent("en");
  });

  it("should toggle language between PL and EN", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const toggleButton = screen.getByTestId("toggle");
    const currentLang = screen.getByTestId("current-language");

    // Initial state should be PL
    expect(currentLang).toHaveTextContent("pl");

    // Toggle to EN
    fireEvent.click(toggleButton);
    expect(currentLang).toHaveTextContent("en");

    // Toggle back to PL
    fireEvent.click(toggleButton);
    expect(currentLang).toHaveTextContent("pl");
  });

  it("should persist language to localStorage", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const setEnButton = screen.getByTestId("set-en");
    fireEvent.click(setEnButton);

    expect(localStorage.getItem("pitchpredict-language")).toBe("en");
  });

  it("should update HTML lang attribute when language changes", () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const setEnButton = screen.getByTestId("set-en");
    fireEvent.click(setEnButton);

    expect(document.documentElement.lang).toBe("en");

    const setPlButton = screen.getByTestId("set-pl");
    fireEvent.click(setPlButton);

    expect(document.documentElement.lang).toBe("pl");
  });
});
