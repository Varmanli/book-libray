import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicProfile } from "@/lib/profile/service";
import { getPublishedNotesByUsername } from "@/lib/notes/service";
import {
  isReservedUsername,
  normalizeUsername,
} from "@/lib/profile/username-rules";
import PublicShell from "@/components/PublicShell";
import ProfileNotesList from "@/components/profile/ProfileNotesList";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ProfileNotesPage({ params }: Props) {
  const { username } = await params;
  const normalizedUsername = normalizeUsername(username);

  if (isReservedUsername(normalizedUsername)) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const result = await getPublicProfile(username, viewer?.id);

  if (!result.found || result.isPrivate) {
    notFound();
  }

  const { profile } = result;

  const notesResult = await getPublishedNotesByUsername(username, viewer?.id, {
    limit: 10,
    offset: 0,
  });

  const notes =
    notesResult.found && !notesResult.isPrivate ? notesResult.notes : [];
  const initialHasMore =
    notesResult.found && !notesResult.isPrivate ? notesResult.hasMore : false;

  return (
    <PublicShell>
      <main className="relative mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10" dir="rtl">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(128,167,150,0.1),transparent_52%)]" />

        <div className="space-y-6">
          {/* Back link */}
          <div className="text-right">
            <Link
              href={`/${encodeURIComponent(profile.username || username)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              بازگشت به پروفایل
            </Link>
          </div>

          {/* Profile-style Editorial Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
            <div className="flex items-center gap-4">
              <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-base font-black text-foreground shadow-sm sm:h-16 sm:w-16">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.image}
                    alt={profile.displayName || "کاربر"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{(profile.displayName || "ق").trim().charAt(0)}</span>
                )}
              </span>

              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black text-foreground sm:text-xl leading-none">
                    {profile.displayName || profile.username}
                  </h1>
                  <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                    یادداشت‌ها
                  </span>
                </div>
                <p dir="ltr" className="text-xs text-muted-foreground text-right">
                  @{profile.username}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left max-w-md">
              <p className="text-xs leading-6 text-muted-foreground sm:text-sm">
                مجموعه یادداشت‌ها و برداشت‌های نوشته شده درباره کتاب‌ها در کتابخانه شخصی {profile.displayName || profile.username}
              </p>
            </div>
          </div>

          <ProfileNotesList
            initialNotes={notes}
            initialHasMore={initialHasMore}
            username={profile.username || username}
            canLike={!!viewer}
          />
        </div>
      </main>
    </PublicShell>
  );
}
