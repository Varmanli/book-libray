import { z } from "zod";

export const personalBookNoteSchema = z.object({
  content: z.string().trim().min(1, "متن یادداشت را بنویسید").max(3000, "یادداشت نمی‌تواند بیشتر از ۳۰۰۰ نویسه باشد"),
  pageNumber: z.number().int().min(1, "شماره صفحه باید حداقل ۱ باشد").nullable().optional(),
});
