import { z } from "zod";

export const commitResultSchema = z.object({
  catalog: z.object({ id: z.string(), title: z.string(), action: z.enum(["CREATED", "REUSED", "UPDATED"]) }),
  editions: z.array(z.object({ extractedEditionIndex: z.number(), action: z.string(), editionId: z.string().optional(), catalogId: z.string().optional(), coverAction: z.string() })),
  entities: z.object({ created: z.array(z.object({ entityType: z.string(), id: z.string(), name: z.string() })), reused: z.array(z.object({ entityType: z.string(), id: z.string(), name: z.string() })) }),
  warnings: z.array(z.string()),
});

export const commitSuccessSchema = z.object({
  ok: z.literal(true),
  result: commitResultSchema,
  sessionId: z.string(),
  sessionStatus: z.literal("SUCCESS"),
  urls: z.object({ admin: z.string(), public: z.string(), history: z.string() }),
  alreadyCompleted: z.boolean().optional(),
});
export type CommitSuccess = z.infer<typeof commitSuccessSchema>;
