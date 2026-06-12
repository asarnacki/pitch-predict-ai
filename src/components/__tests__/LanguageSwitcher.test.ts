import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/vue";
import LanguageSwitcher from "../LanguageSwitcher.vue";
import { __testing } from "@/lib/i18n";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    __testing.resetLanguage("pl");
  });

  it("should render the language switcher button", () => {
    render(LanguageSwitcher);

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toBeInTheDocument();
  });

  it("should show current language label", () => {
    render(LanguageSwitcher);

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toHaveTextContent(/Polski/i);
  });

  it("should change language when option selected", async () => {
    render(LanguageSwitcher);

    const button = screen.getByTestId("language-switcher-trigger");

    // Initial state
    expect(button).toHaveTextContent(/Polski/i);

    // Open dropdown and select EN
    await fireEvent.click(button);
    await fireEvent.click(screen.getByTestId("language-option-en"));
    expect(button).toHaveTextContent(/English/i);

    // Open dropdown and select PL
    await fireEvent.click(button);
    await fireEvent.click(screen.getByTestId("language-option-pl"));
    expect(button).toHaveTextContent(/Polski/i);
  });

  it("should have proper aria attributes", () => {
    render(LanguageSwitcher);

    const button = screen.getByTestId("language-switcher-trigger");
    expect(button).toHaveAttribute("aria-haspopup", "listbox");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("should update aria-expanded when opened", async () => {
    render(LanguageSwitcher);

    const button = screen.getByTestId("language-switcher-trigger");
    await fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
