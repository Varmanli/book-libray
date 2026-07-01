import { z } from "zod";

export const createNoteSchema = z.object({
  bookId: z.string().min(1, "شناسه‌ی کتاب لازم است"),
  content: z
    .string()
    .trim()
    .min(1, "متن یادداشت خالی است")
    .max(2000, "یادداشت بیش از حد طولانی است"),
});

export const updateNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "متن یادداشت خالی است")
    .max(2000, "یادداشت بیش از حد طولانی است"),
});

export const addToLibraryFromBookSchema = z.object({
  status: z.enum(["UNREAD", "READING", "FINISHED"]).default("UNREAD"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
