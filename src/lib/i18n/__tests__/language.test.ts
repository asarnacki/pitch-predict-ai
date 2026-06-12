import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useLanguage, __testing } from "../language";

describe("language singleton", () => {
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
    const { language } = useLanguage();

    expect(language.value).toBe("pl");
  });

  it("should change language using setLanguage", () => {
    const { language, setLanguage } = useLanguage();

    setLanguage("en");

    expect(language.value).toBe("en");
  });

  it("should toggle language between PL and EN", () => {
    const { language, toggleLanguage } = useLanguage();

    // Initial state should be PL
    expect(language.value).toBe("pl");

    // Toggle to EN
    toggleLanguage();
    expect(language.value).toBe("en");

    // Toggle back to PL
    toggleLanguage();
    expect(language.value).toBe("pl");
  });

  it("should persist language to localStorage", () => {
    const { setLanguage } = useLanguage();

    setLanguage("en");

    expect(localStorage.getItem("pitchpredict-language")).toBe("en");
  });

  it("should update HTML lang attribute when language changes", () => {
    const { setLanguage } = useLanguage();

    setLanguage("en");
    expect(document.documentElement.lang).toBe("en");

    setLanguage("pl");
    expect(document.documentElement.lang).toBe("pl");
  });
});
