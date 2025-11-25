import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const exampleSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

describe('Example Unit Test (Validation)', () => {
  it('should validate correct data', () => {
    const validData = {
      email: 'test@example.com',
      age: 25,
    };

    const result = exampleSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      age: 25,
    };

    const result = exampleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].code).toBe('invalid_string');
    }
  });

  it('should reject age under 18', () => {
    const invalidData = {
      email: 'test@example.com',
      age: 17,
    };

    const result = exampleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

