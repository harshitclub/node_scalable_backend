import { z } from "zod";

// Signup Validator
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),
});

// Login Validator
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Request verification email
export const requestVerificationSchema = z.object({
  email: z.email("Invalid email address"),
});

// Verify account
export const verifyAccountSchema = z.object({
  token: z.string().min(10, "Invalid verification token"),
});
