import { describe, it, expect } from "vitest";
import { savePredictionSchema } from "../prediction.schemas";

describe("savePredictionSchema", () => {
  it("should pass with valid userChoice and note", () => {
    const result = savePredictionSchema.safeParse({
      userChoice: "home",
      note: "I think home team will win",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userChoice).toBe("home");
      expect(result.data.note).toBe("I think home team will win");
    }
  });

  it("should transform empty note to null", () => {
    const result = savePredictionSchema.safeParse({
      userChoice: "draw",
      note: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBeNull();
    }
  });

  it("should allow null userChoice", () => {
    const result = savePredictionSchema.safeParse({
      userChoice: null,
      note: "Some note",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userChoice).toBeNull();
    }
  });

  it("should fail with invalid userChoice value", () => {
    const result = savePredictionSchema.safeParse({
      userChoice: "invalid",
      note: null,
    });

    expect(result.success).toBe(false);
  });

  it("should trim note whitespace", () => {
    const result = savePredictionSchema.safeParse({
      userChoice: "away",
      note: "  trimmed note  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe("trimmed note");
    }
  });
});
