import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { AnalyticsPageView } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ANALYTICS_VISITOR_COOKIE,
  describeAnalyticsContent,
  isAnalyticsBot,
  normalizeAnalyticsPath,
} from "@/lib/analytics/tracking";

export async function POST(request: NextRequest) {
  if (isAnalyticsBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
  }

  const body: unknown = await request.json().catch(() => null);
  const path = normalizeAnalyticsPath(
    body && typeof body === "object" && "path" in body
      ? (body as { path?: unknown }).path
      : null,
  );
  if (!path) return new NextResponse(null, { status: 204 });

  const visitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value || randomUUID();
  const [user, content] = await Promise.all([
    getCurrentUser(),
    Promise.resolve(describeAnalyticsContent(path)),
  ]);
  await db.insert(AnalyticsPageView).values({
    visitorId,
    userId: user?.id,
    path: content.path,
    contentKind: content.contentKind,
    contentSlug: content.contentSlug,
  });

  const response = new NextResponse(null, { status: 204 });
  if (!request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value) {
    response.cookies.set(ANALYTICS_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
