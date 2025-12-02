import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, wielką literę i cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, wielką literę i cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export const registerRequestSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, wielką literę i cyfrę"),
});

export const updatePasswordRequestSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą literę, wielką literę i cyfrę"),
});

export type LoginRequest = LoginFormData;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type ResetPasswordRequest = ResetPasswordFormData;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;
