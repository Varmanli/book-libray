import { z } from "zod";

export const setRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const catalogStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type SetRoleInput = z.infer<typeof setRoleSchema>;
