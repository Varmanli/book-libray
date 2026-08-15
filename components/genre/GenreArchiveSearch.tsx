"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function GenreArchiveSearch({ initialQuery }: { initialQuery: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const clearSearch = () => {
    setQuery("");
    router.push(pathname);
  };

  return (
    <form
      className="mt-6"
      action={pathname}
      onSubmit={() => {
        // The form intentionally omits page, so every new query starts at page one.
      }}
    >
      <label className="sr-only" htmlFor="genre-search">جست‌وجو در ژانرها و موضوعات</label>
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="genre-search"
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجو در ژانرها و موضوعات..."
          className="h-14 w-full rounded-[1.8rem] border border-border/70 bg-card/70 pr-12 pl-11 text-sm text-foreground shadow-[0_24px_80px_-60px_rgba(0,0,0,0.7)] outline-none transition placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/15 sm:text-base"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            aria-label="پاک کردن جستجو"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
