import { z } from "zod";

export const setRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().max(255).nullable().optional(),
  username: z.string().trim().min(3).max(30).nullable().optional(),
  email: z.string().trim().email("ایمیل نامعتبر است").max(255).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  image: z.string().trim().max(1000).nullable().optional(),
});

export const catalogStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type SetRoleInput = z.infer<typeof setRoleSchema>;
