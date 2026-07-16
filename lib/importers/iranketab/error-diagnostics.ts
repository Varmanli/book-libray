export type IranKetabErrorCheckpoint = {
  name: string;
  functionName: string;
  stage: string;
  statement: string;
};

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  functionName?: string;
  stage?: string;
  lastCheckpoint?: string;
  statement?: string;
  diagnostic?: Record<string, unknown>;
};

type ErrorWithDiagnostics = Error & {
  code?: unknown;
  cause?: unknown;
  functionName?: unknown;
  stage?: unknown;
  lastCheckpoint?: unknown;
  checkpointStatement?: unknown;
  diagnostic?: unknown;
};

function asDiagnosticError(error: unknown): ErrorWithDiagnostics | undefined {
  return error instanceof Error ? (error as ErrorWithDiagnostics) : undefined;
}

/** Attach execution context to the actual thrown instance, never to a stale wrapper. */
export function attachErrorCheckpoint(
  error: unknown,
  checkpoint: IranKetabErrorCheckpoint,
): unknown {
  const target = asDiagnosticError(error);
  if (!target) return error;
  target.functionName = checkpoint.functionName;
  target.stage = checkpoint.stage;
  target.lastCheckpoint = checkpoint.name;
  target.checkpointStatement = checkpoint.statement;
  return error;
}

export function attachErrorCheckpointIfMissing(
  error: unknown,
  checkpointValue: IranKetabErrorCheckpoint,
): unknown {
  const target = asDiagnosticError(error);
  if (!target || typeof target.lastCheckpoint === "string") return error;
  return attachErrorCheckpoint(error, checkpointValue);
}

export function lastCheckpointInChain(error: unknown): string | undefined {
  const chain = serializeErrorChain(error);
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    if (chain[index].lastCheckpoint) return chain[index].lastCheckpoint;
  }
  return undefined;
}

export function checkpoint(
  name: string,
  functionName: string,
  stage: string,
  statement: string,
): IranKetabErrorCheckpoint {
  return { name, functionName, stage, statement };
}

export function causeOf(error: unknown): unknown {
  return asDiagnosticError(error)?.cause;
}

export function findInErrorChain<T extends Error>(
  error: unknown,
  predicate: (value: Error) => value is T,
): T | undefined {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current instanceof Error && !seen.has(current)) {
    if (predicate(current)) return current;
    seen.add(current);
    current = causeOf(current);
  }
  return undefined;
}

/** Development-only serializer. It is deliberately linear and cycle-safe. */
export function serializeErrorChain(error: unknown): SerializedError[] {
  const chain: SerializedError[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      const value = current as ErrorWithDiagnostics;
      const diagnostic =
        value.diagnostic && typeof value.diagnostic === "object"
          ? (value.diagnostic as Record<string, unknown>)
          : undefined;
      chain.push({
        name: current.name || current.constructor.name || "Error",
        message: current.message,
        ...(current.stack ? { stack: current.stack } : {}),
        ...(typeof value.code === "string" ? { code: value.code } : {}),
        ...(typeof value.functionName === "string" || typeof diagnostic?.functionName === "string"
          ? { functionName: (value.functionName ?? diagnostic?.functionName) as string }
          : {}),
        ...(typeof value.stage === "string" || typeof diagnostic?.stage === "string"
          ? { stage: (value.stage ?? diagnostic?.stage) as string }
          : {}),
        ...(typeof value.lastCheckpoint === "string" || typeof diagnostic?.lastCheckpoint === "string"
          ? { lastCheckpoint: (value.lastCheckpoint ?? diagnostic?.lastCheckpoint) as string }
          : {}),
        ...(typeof value.checkpointStatement === "string"
          ? { statement: value.checkpointStatement }
          : {}),
        ...(diagnostic ? { diagnostic } : {}),
      });
      current = value.cause;
      continue;
    }
    chain.push({
      name: typeof current,
      message:
        typeof current === "string"
          ? current
          : "Non-Error value was thrown",
    });
    break;
  }
  return chain;
}
