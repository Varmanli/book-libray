import { z } from "zod";
import { iranKetabImportDraftSchema } from "./draft";

export const preparedCoverResultSchema = z.discriminatedUnion("status", [
  z.object({
    extractedEditionIndex: z.number().int().nonnegative(),
    sourceEditionCode: z.string().min(1),
    status: z.literal("PREPARED"),
    action: z.literal("USE_PREPARED"),
    objectKey: z.string().min(1),
    url: z.string().min(1),
    originalSourceUrl: z.string().url(),
    mimeType: z.literal("image/webp"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sizeBytes: z.number().int().positive(),
    preparedAt: z.string().datetime(),
  }),
  z.object({ extractedEditionIndex: z.number().int().nonnegative(), sourceEditionCode: z.string().min(1), status: z.literal("SKIPPED") }),
  z.object({ extractedEditionIndex: z.number().int().nonnegative(), sourceEditionCode: z.string().min(1), status: z.literal("KEPT_EXISTING") }),
  z.object({
    extractedEditionIndex: z.number().int().nonnegative(),
    sourceEditionCode: z.string().min(1),
    status: z.literal("FAILED"),
    error: z.object({ code: z.string(), message: z.string(), retryable: z.boolean() }),
  }),
]);

export const preparedDraftSchema = z.object({
  draft: iranKetabImportDraftSchema,
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  preparedCovers: z.array(preparedCoverResultSchema),
});

export const prepareCoversSuccessSchema = z.object({
  ok: z.literal(true),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  results: z.array(preparedCoverResultSchema),
  preparedDraft: preparedDraftSchema,
  summary: z.object({ requested: z.number().int(), prepared: z.number().int(), skipped: z.number().int(), keptExisting: z.number().int(), failed: z.number().int() }),
});

export type PreparedCoverResult = z.infer<typeof preparedCoverResultSchema>;
export type PreparedDraft = z.infer<typeof preparedDraftSchema>;

export function preparedDraftMatchesCurrent(prepared: PreparedDraft, current: unknown) {
  const parsed = iranKetabImportDraftSchema.safeParse(current);
  return parsed.success && JSON.stringify(prepared.draft) === JSON.stringify(parsed.data);
}
