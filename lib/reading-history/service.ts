import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { ReadingEvent } from "@/db/schema";

export type PersonalReadingEvent = {
  id: string;
  type: "START" | "PROGRESS" | "FINISH";
  pageFrom: number | null;
  pageTo: number | null;
  pagesRead: number | null;
  createdAt: Date;
};

export type ReadingHistory = {
  events: PersonalReadingEvent[];
  summary: {
    days: number | null;
    pagesRead: number | null;
    averagePagesPerDay: number | null;
  };
};

export async function getReadingHistory(
  userId: string,
  bookId: string,
): Promise<ReadingHistory> {
  const events = await db
    .select({
      id: ReadingEvent.id,
      type: ReadingEvent.type,
      pageFrom: ReadingEvent.pageFrom,
      pageTo: ReadingEvent.pageTo,
      pagesRead: ReadingEvent.pagesRead,
      createdAt: ReadingEvent.createdAt,
    })
    .from(ReadingEvent)
    .where(
      and(eq(ReadingEvent.userId, userId), eq(ReadingEvent.bookId, bookId)),
    )
    .orderBy(asc(ReadingEvent.createdAt));

  const start = events.find((event) => event.type === "START")?.createdAt;
  const finish = [...events].reverse().find((event) => event.type === "FINISH")
    ?.createdAt;
  const lastEvent = events.at(-1)?.createdAt;
  const end = finish ?? lastEvent;
  const days =
    start && end
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
      : null;
  const pagesRead = events.reduce(
    (total, event) => total + Math.max(0, event.pagesRead ?? 0),
    0,
  );

  return {
    events,
    summary: {
      days,
      pagesRead: pagesRead > 0 ? pagesRead : null,
      averagePagesPerDay:
        days && pagesRead > 0 ? Math.round(pagesRead / days) : null,
    },
  };
}
