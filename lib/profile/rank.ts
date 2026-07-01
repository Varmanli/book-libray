import {
  Award,
  BookMarked,
  BookOpen,
  Crown,
  Flame,
  Sprout,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface ReaderRank {
  /** 1-based position in the ladder. */
  level: number;
  key: string;
  title: string;
  description: string;
  /** Inclusive lower bound of finished books. */
  min: number;
  /** Inclusive upper bound; null for the open-ended top rank. */
  max: number | null;
  icon: LucideIcon;
  /** Text accent class. */
  accent: string;
  /** Badge background/ring classes. */
  badgeClass: string;
}

// Ladder is derived purely from finished-book count — never edited manually.
export const READER_RANKS: ReaderRank[] = [
  {
    level: 1,
    key: "newcomer",
    title: "تازه‌وارد",
    description: "سفر کتاب‌خوانی‌ات همین حالا آغاز می‌شود.",
    min: 0,
    max: 0,
    icon: Sprout,
    accent: "text-slate-300",
    badgeClass: "bg-slate-400/10 ring-slate-300/20",
  },
  {
    level: 2,
    key: "starter",
    title: "شروع‌کننده",
    description: "اولین کتاب‌ها را به پایان رسانده‌ای.",
    min: 1,
    max: 4,
    icon: BookOpen,
    accent: "text-emerald-300",
    badgeClass: "bg-emerald-400/10 ring-emerald-300/20",
  },
  {
    level: 3,
    key: "rising",
    title: "کتاب‌خوان نوپا",
    description: "عادت کتاب‌خوانی در تو شکل گرفته است.",
    min: 5,
    max: 14,
    icon: BookMarked,
    accent: "text-sky-300",
    badgeClass: "bg-sky-400/10 ring-sky-300/20",
  },
  {
    level: 4,
    key: "active",
    title: "کتاب‌خوان فعال",
    description: "به‌طور پیوسته کتاب می‌خوانی و پیش می‌روی.",
    min: 15,
    max: 29,
    icon: Flame,
    accent: "text-amber-300",
    badgeClass: "bg-amber-400/10 ring-amber-300/20",
  },
  {
    level: 5,
    key: "pro",
    title: "کتاب‌خوان حرفه‌ای",
    description: "کتاب‌خوانی بخشی جدی از زندگی توست.",
    min: 30,
    max: 59,
    icon: Award,
    accent: "text-violet-300",
    badgeClass: "bg-violet-400/10 ring-violet-300/20",
  },
  {
    level: 6,
    key: "master",
    title: "استاد قفسه",
    description: "قفسه‌ای پربار و کارنامه‌ای چشمگیر داری.",
    min: 60,
    max: 99,
    icon: Star,
    accent: "text-rose-300",
    badgeClass: "bg-rose-400/10 ring-rose-300/20",
  },
  {
    level: 7,
    key: "legend",
    title: "افسانه‌ی کتاب‌ها",
    description: "به جمع افسانه‌های کتاب‌خوانی پیوسته‌ای.",
    min: 100,
    max: null,
    icon: Crown,
    accent: "text-[#d4ff6a]",
    badgeClass: "bg-[#d4ff6a]/10 ring-[#d4ff6a]/25",
  },
];

export interface ReaderRankProgress {
  rank: ReaderRank;
  finished: number;
  isMax: boolean;
  next: ReaderRank | null;
  /** Finished books still required to reach `next` (0 at max). */
  toNext: number;
  /** 0–100 progress through the current band toward the next rank. */
  progressPct: number;
}

/**
 * Pure rank resolver. Single source of truth for reader rank — callers must pass
 * the same finished count used by profile stats (`ReadingStats.finished`).
 */
export function getReaderRank(finishedRaw: number): ReaderRankProgress {
  const finished = Math.max(0, Math.floor(finishedRaw || 0));

  const rank =
    READER_RANKS.find(
      (r) => finished >= r.min && (r.max === null || finished <= r.max)
    ) ?? READER_RANKS[READER_RANKS.length - 1];

  const next = READER_RANKS[rank.level] ?? null; // level is 1-based → next index

  if (!next) {
    return { rank, finished, isMax: true, next: null, toNext: 0, progressPct: 100 };
  }

  const bandStart = rank.min;
  const bandEnd = next.min;
  const progressPct = Math.min(
    100,
    Math.max(0, ((finished - bandStart) / (bandEnd - bandStart)) * 100)
  );
  const toNext = Math.max(0, next.min - finished);

  return { rank, finished, isMax: false, next, toNext, progressPct };
}
