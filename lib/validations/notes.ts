import { z } from "zod";
import { richTextToPlainText } from "@/lib/content/rich-text";

// Notes are long-form reading material, not short comments. Keep a generous
// application-level ceiling so a single request cannot create an unreasonable
// payload, while allowing substantial research and reflection.
export const NOTE_MAX_STORED_CHARACTERS = 50_000;
export const NOTE_MAX_VISIBLE_CHARACTERS = 40_000;

export const noteContentSchema = z
  .string()
  .trim()
  .max(NOTE_MAX_STORED_CHARACTERS, "ساختار یادداشت بیش از حد طولانی است")
  .refine((value) => richTextToPlainText(value).length > 0, "متن یادداشت خالی است")
  .refine(
    (value) => richTextToPlainText(value).length <= NOTE_MAX_VISIBLE_CHARACTERS,
    "یادداشت بیش از حد طولانی است",
  );

export const createNoteSchema = z.object({
  catalogBookId: z.string().min(1, "شناسه‌ی کتاب لازم است"),
  bookEditionId: z.string().min(1).optional().nullable(),
  scope: z.enum(["book", "edition"]),
  content: noteContentSchema,
}).superRefine((value, ctx) => {
  if (value.scope === "edition" && !value.bookEditionId) {
    ctx.addIssue({
      code: "custom",
      path: ["bookEditionId"],
      message: "برای یادداشت نسخه باید یک نسخه انتخاب شود",
    });
  }

  if (value.scope === "book" && value.bookEditionId) {
    ctx.addIssue({
      code: "custom",
      path: ["bookEditionId"],
      message: "یادداشت درباره خود کتاب نباید به نسخه وصل شود",
    });
  }
});

export const updateNoteSchema = z.object({ content: noteContentSchema });

export const addToLibraryFromBookSchema = z.object({
  status: z.enum(["UNREAD", "READING", "FINISHED"]).default("UNREAD"),
  editionId: z.string().min(1).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
