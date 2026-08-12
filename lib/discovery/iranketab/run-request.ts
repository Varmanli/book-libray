import { runIranKetabDiscoverySchema } from "@/lib/validations/iranketab-discovery";

export type DiscoveryRunRequestDependencies = {
  runManualDiscoverySource(sourceId: string): Promise<unknown>;
  runScheduledDiscovery(): Promise<unknown>;
};

/** Shared request orchestration for the admin run endpoint. */
export async function executeIranKetabDiscoveryRunRequest(
  body: unknown,
  dependencies: DiscoveryRunRequestDependencies,
) {
  const parsed = runIranKetabDiscoverySchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, code: "VALIDATION_ERROR" as const };

  if (parsed.data.sourceId) {
    return {
      ok: true as const,
      manual: true as const,
      result: await dependencies.runManualDiscoverySource(parsed.data.sourceId),
    };
  }
  return { ok: true as const, manual: false as const, result: await dependencies.runScheduledDiscovery() };
}
