import { describe, it, expect } from "vitest";
import { sanitizeNote } from "../prediction.service";

describe("sanitizeNote", () => {
  it("should return null for empty input", () => {
    expect(sanitizeNote(null)).toBeNull();
    expect(sanitizeNote(undefined)).toBeNull();
    expect(sanitizeNote("")).toBeNull();
  });

  it("should escape HTML special characters", () => {
    const malicious = "<script>alert('xss')</script>";
    const sanitized = sanitizeNote(malicious);

    expect(sanitized).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
  });

  it("should trim whitespace from note", () => {
    const result = sanitizeNote("  my note  ");

    expect(result).toBe("my note");
  });

  it("should preserve normal text", () => {
    const normalText = "Manchester United will win 2-1";
    const result = sanitizeNote(normalText);

    expect(result).toBe(normalText);
  });
});
