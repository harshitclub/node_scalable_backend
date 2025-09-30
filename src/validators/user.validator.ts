import { z } from "zod";

// Update Profile Validator
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character")
    .optional(),
});

// Delete Profile Validator
export const deleteProfileSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});
