import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  Globe,
  Instagram,
  Linkedin,
  Lock,
  Send,
  ShieldAlert,
  Twitter,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getPublicProfile } from "@/lib/profile/service";
import { getPublicQuotesByUsername } from "@/lib/quotes/service";
import { getPublishedNotesByUsername } from "@/lib/notes/service";
import {
  isReservedUsername,
  normalizeUsername,
} from "@/lib/profile/username-rules";
import PublicShell from "@/components/PublicShell";
import LibraryShowcase from "@/components/profile/LibraryShowcase";
import QuotesSection from "@/components/profile/QuotesSection";
import NotesSection from "@/components/profile/NotesSection";
import ProfileHeader, {
  type ProfileSocialLink,
} from "@/components/profile/ProfileHeader";

export const dynamic = "force-dynamic";

type RootProfilePageProps = {
  params: Promise<{ username: string }>;
};

type SocialProfile = {
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  telegram: string | null;
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(128,167,150,0.16),transparent_48%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-24 -z-10 h-56 rounded-full bg-primary/5 blur-3xl" />
        {children}
      </main>
    </PublicShell>
  );
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeSocialHandle(value: string) {
  return value.trim().replace(/^@/, "");
}

function socialLinks(profile: SocialProfile): ProfileSocialLink[] {
  const links: ProfileSocialLink[] = [];

  if (profile.website) {
    const href = normalizeExternalUrl(profile.website);

    if (href) {
      links.push({ href, label: "وب‌سایت", icon: Globe });
    }
  }

  if (profile.instagram) {
    const handle = normalizeSocialHandle(profile.instagram);

    if (handle) {
      links.push({
        href: `https://instagram.com/${handle}`,
        label: "اینستاگرام",
        icon: Instagram,
      });
    }
  }

  if (profile.twitter) {
    const handle = normalizeSocialHandle(profile.twitter);

    if (handle) {
      links.push({
        href: `https://x.com/${handle}`,
        label: "ایکس",
        icon: Twitter,
      });
    }
  }

  if (profile.telegram) {
    const handle = normalizeSocialHandle(profile.telegram);

    if (handle) {
      links.push({
        href: `https://t.me/${handle}`,
        label: "تلگرام",
        icon: Send,
      });
    }
  }

  if (profile.linkedin) {
    const href = normalizeExternalUrl(profile.linkedin);

    if (href) {
      links.push({ href, label: "لینکدین", icon: Linkedin });
    }
  }

  return links;
}

export default async function RootProfilePage({
  params,
}: RootProfilePageProps) {
  const { username } = await params;
  const normalizedUsername = normalizeUsername(username);

  if (isReservedUsername(normalizedUsername)) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const result = await getPublicProfile(username, viewer?.id);

  if (!result.found) {
    notFound();
  }

  if (result.isPrivate) {
    return (
      <Shell>
        <PrivateProfileState
          name={result.displayName}
          username={result.username || username}
          image={result.image}
        />
      </Shell>
    );
  }

  const { profile, stats, books, isOwner } = result;
  const profileUsername = profile.username || username;

  const joined = new Date(profile.joinedAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
  });

  const [quotesResult, notesResult] = await Promise.all([
    getPublicQuotesByUsername(username, viewer?.id),
    getPublishedNotesByUsername(username, viewer?.id),
  ]);

  const quotes =
    quotesResult.found && !quotesResult.isPrivate ? quotesResult.quotes : [];

  const notes =
    notesResult.found && !notesResult.isPrivate ? notesResult.notes : [];

  return (
    <Shell>
      <div className="space-y-5 sm:space-y-6">
        <ProfileHeader
          name={profile.displayName}
          username={profileUsername}
          image={profile.image}
          bannerImage={profile.bannerImage}
          bio={profile.bio}
          location={profile.location}
          joined={joined}
          visibility={profile.profileVisibility}
          isOwner={isOwner}
          finished={stats.finished}
          socialLinks={socialLinks(profile)}
        />

        <LibraryShowcase
          books={books}
          username={profileUsername}
          stats={stats}
        />

        <QuotesSection
          quotes={quotes}
          initialHasMore={quotesResult.found && !quotesResult.isPrivate ? quotesResult.hasMore : false}
          username={profileUsername}
          isOwner={isOwner}
          canLike={!!viewer}
        />

        <NotesSection
          notes={notes}
          initialHasMore={notesResult.found && !notesResult.isPrivate ? notesResult.hasMore : false}
          username={profileUsername}
          isOwner={isOwner}
          canLike={!!viewer}
        />
      </div>
    </Shell>
  );
}

function PrivateProfileState({
  name,
  username,
  image,
}: {
  name: string | null;
  username: string | null;
  image: string | null;
}) {
  const displayName = name || username || "کاربر قفسه";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 px-5 py-12 text-center shadow-[0_24px_70px_-50px_rgba(0,0,0,0.42)] sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="relative">
          <AvatarCircle src={image} name={displayName} />
          <span className="absolute -bottom-1 -left-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground shadow-lg">
            <Lock className="h-4 w-4" />
          </span>
        </div>

        <h1 className="mt-5 text-xl font-black text-foreground">
          {displayName}
        </h1>

        {username ? (
          <p dir="ltr" className="mt-1 text-sm text-muted-foreground">
            @{username}
          </p>
        ) : null}

        <div className="mt-7 flex items-start gap-3 rounded-[1.35rem] border border-border/80 bg-background/55 px-4 py-3.5 text-start shadow-sm shadow-black/5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldAlert className="h-4 w-4" />
          </span>

          <div>
            <p className="text-sm font-black text-foreground">
              این پروفایل خصوصی است
            </p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              کتابخانه، یادداشت‌ها و تکه‌های این کاربر فقط برای خودش قابل مشاهده
              است.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarCircle({
  src,
  name,
}: {
  src: string | null;
  name: string | null;
}) {
  const initial = (name || "ق").trim().charAt(0) || "ق";

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-secondary text-3xl ring-1 ring-inset ring-white/10 shadow-[0_20px_45px_-28px_rgba(0,0,0,0.45)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "آواتار"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-black text-muted-foreground">{initial}</span>
      )}
    </div>
  );
}
