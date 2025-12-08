import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from "../auth.schemas";

describe("loginSchema", () => {
  it("should pass with valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("should fail with invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nieprawidłowy format e-mail");
    }
  });

  it("should fail with password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
    }
  });
});

describe("registerSchema", () => {
  it("should pass with valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });

    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Hasła nie są identyczne");
    }
  });

  it("should fail when password lacks required characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Hasło musi zawierać małą literę, wielką literę i cyfrę");
    }
  });
});
