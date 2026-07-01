import { Lock } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import UserLibraryPage from "@/components/library/UserLibraryPage";
import { getCurrentUser } from "@/lib/auth/session";
import { findBookRouteCandidate } from "@/lib/book/service";
import {
  getLibraryByUsername,
  type LibraryByUsernameResult,
} from "@/lib/library/service";
import {
  isBookIdLikeIdentifier,
  normalizeUsername,
} from "@/lib/profile/username-rules";

export const dynamic = "force-dynamic";

// Temporary, gated diagnostics for the route-split rollout. Enable by setting
// DEBUG_LIBRARY_ROUTE=1 in the environment; remove once the split is verified.
const DEBUG = process.env.DEBUG_LIBRARY_ROUTE === "1";
function debug(...args: unknown[]) {
  if (DEBUG) console.debug("[books/[username]]", ...args);
}

/**
 * `/books/[username]` is ONLY a user library page. It never renders book
 * detail — that now lives at the unambiguous `/book/[id]` route. The single
 * concession to history is a migration redirect: if an old `/books/<bookId>`
 * link is hit, we forward it to `/book/<bookId>` rather than rendering here.
 */
export default async function UserLibraryRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const [{ username: rawUsername }, { q, filter }] = await Promise.all([
    params,
    searchParams,
  ]);
  const viewer = await getCurrentUser();
  // Trim + lower-case so lookup matches however the link was cased/spaced.
  const username = normalizeUsername(rawUsername);

  debug("raw:", JSON.stringify(rawUsername), "normalized:", username, "viewer:", {
    id: viewer?.id,
    email: viewer?.email,
    username: viewer?.username,
  });

  // Backward-compat migration ONLY: an old book-detail link shaped like a real
  // book id is redirected to the new /book/[id] route. This is a redirect, not
  // shared rendering — no book detail is ever rendered from this page.
  if (isBookIdLikeIdentifier(rawUsername)) {
    const book = await findBookRouteCandidate(rawUsername);
    if (book) {
      debug("id-like segment matched a book → redirect to /book/", rawUsername);
      redirect(`/book/${rawUsername}`);
    }
  }

  // The DATABASE is the single source of truth for whether a username exists —
  // not a shape regex. Legacy usernames (e.g. underscores) are still real users,
  // so we resolve by querying, and only 404 when no user actually matches. This
  // is the same source the Header reads, so the two can never disagree.
  const library = await getLibraryByUsername(username, viewer?.id);

  if (!library.found) {
    debug("library lookup: not-found → notFound()", username);
    notFound();
  }

  debug(
    "library lookup: found",
    library.isPrivate ? "private" : "public",
    "owner:",
    library.isOwner
  );

  return renderLibrary(library, q ?? "", filter);
}

/** Renders a resolved library result, including the private-library notice. */
function renderLibrary(
  library: Extract<LibraryByUsernameResult, { found: true }>,
  search: string,
  filter?: string
) {
  if (library.isPrivate) {
    const displayName =
      library.profile.displayName || library.profile.username || "کاربر قفسه";

    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center rounded-[32px] border border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xl font-bold text-muted-foreground ring-1 ring-white/10">
            {library.profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={library.profile.image}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{displayName.trim().charAt(0)}</span>
            )}
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">
            {displayName}
          </h1>
          <p dir="ltr" className="text-sm text-muted-foreground">
            @{library.profile.username}
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            این کتابخانه خصوصی است.
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserLibraryPage
      initialData={library}
      initialSearch={search}
      initialFilter={filter}
    />
  );
}
