import { z } from "zod";

import { sanitizeMoodTags } from "@/lib/book/moods";

const userBookUpdateSchema = z
  .object({
    status: z.enum(["UNREAD", "READING", "PAUSED", "STOPPED", "FINISHED"]).optional(),
    // Personal ratings are shown and selected on a 1–10 scale in the reading
    // controls. Zero is retained as the client-side clear value.
    rating: z.number().int().min(0).max(10).nullable().optional(),
    review: z.string().max(10_000).nullable().optional(),
    moodTags: z.unknown().optional(),
    isFavorite: z.boolean().optional(),
  })
  .strict();

export type UserBookUpdate = {
  status?: "UNREAD" | "READING" | "PAUSED" | "STOPPED" | "FINISHED";
  rating?: number | null;
  review?: string | null;
  moodTags?: string[] | null;
  isFavorite?: boolean;
};

/**
 * Only personal library state can be updated by a regular user. Catalog and
 * copied book metadata must be changed through the admin catalog workflow.
 */
export function parseUserBookUpdate(input: unknown):
  | { success: true; data: UserBookUpdate }
  | { success: false; error: string } {
  const parsed = userBookUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "فقط اطلاعات شخصیِ مطالعه قابل بروزرسانی است" };
  }

  const { moodTags, ...personalData } = parsed.data;
  const data: UserBookUpdate = personalData;
  if ("moodTags" in parsed.data) {
    const moods = sanitizeMoodTags(parsed.data.moodTags);
    if (moods === undefined) {
      return { success: false, error: "فهرست حس‌ها نامعتبر است" };
    }
    data.moodTags = moods;
  }

  if (Object.keys(data).length === 0) {
    return { success: false, error: "هیچ مقدار قابل بروزرسانی ارسال نشده" };
  }

  return { success: true, data };
}
