import { NextResponse } from "next/server"
import type { ZodError, ZodIssue } from "zod"

export type ValidationFieldError = {
  path: string
  message: string
  faMessage: string
  receivedLength?: number
  maxLength?: number
}

function getIssuePath(issue: ZodIssue) {
  return issue.path.length > 0 ? issue.path.join(".") : "root"
}

function getPathLabel(path: string, labels: Record<string, string>) {
  const segments = path.split(".")
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]
    if (/^\d+$/.test(segment)) continue
    if (labels[segment]) return labels[segment]
  }
  return path
}

function getPathValue(input: unknown, path: string) {
  if (!path || path === "root") return input

  let current: unknown = input
  for (const segment of path.split(".")) {
    if (current == null) return undefined
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (Number.isNaN(index)) return undefined
      current = current[index]
      continue
    }
    if (typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function getReceivedLength(value: unknown) {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length
  }
  return undefined
}

function buildIssueMessage(issue: ZodIssue, path: string, pathLabel: string) {
  if (issue.code === "too_big") {
    if (issue.origin === "string") {
      return {
        message: `${path} is too long.`,
        faMessage: `${pathLabel} بیش از حد مجاز است.`,
      }
    }
    if (issue.origin === "array") {
      return {
        message: `${path} has too many items.`,
        faMessage: `تعداد موارد ${pathLabel} بیش از حد مجاز است.`,
      }
    }
  }

  if (issue.code === "too_small") {
    if (issue.origin === "string") {
      return {
        message: `${path} is too short.`,
        faMessage: `${pathLabel} کوتاه‌تر از حد مجاز است.`,
      }
    }
    return {
      message: `${path} is below the minimum allowed value.`,
      faMessage: `${pathLabel} کمتر از حد مجاز است.`,
    }
  }

  if (issue.code === "invalid_format") {
    return {
      message: `${path} is invalid.`,
      faMessage: `${pathLabel} معتبر نیست.`,
    }
  }

  if (issue.code === "invalid_type") {
    return {
      message: `${path} has an invalid type.`,
      faMessage: `نوع داده‌ی ${pathLabel} نامعتبر است.`,
    }
  }

  const fallback = issue.message || `${path} is invalid.`
  return {
    message: fallback,
    faMessage: fallback,
  }
}

export function formatZodValidationFields(
  error: ZodError,
  labels: Record<string, string> = {},
  input?: unknown,
): ValidationFieldError[] {
  return error.issues.map((issue) => {
    const path = getIssuePath(issue)
    const pathLabel = getPathLabel(path, labels)
    const receivedLength = getReceivedLength(getPathValue(input, path))
    const maxLength =
      issue.code === "too_big" && typeof issue.maximum === "number"
        ? issue.maximum
        : undefined
    const text = buildIssueMessage(issue, path, pathLabel)

    return {
      path,
      message: text.message,
      faMessage: text.faMessage,
      ...(receivedLength !== undefined ? { receivedLength } : {}),
      ...(maxLength !== undefined ? { maxLength } : {}),
    }
  })
}

export function apiValidationError(
  error: ZodError,
  labels: Record<string, string> = {},
  input?: unknown,
) {
  return NextResponse.json(
    {
      ok: false,
      error: "VALIDATION_ERROR",
      message: "Some fields are invalid.",
      fields: formatZodValidationFields(error, labels, input),
    },
    { status: 422 },
  )
}
