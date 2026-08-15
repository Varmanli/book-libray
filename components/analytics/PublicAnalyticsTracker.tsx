"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEDUPE_MS = 1500;
const STORAGE_KEY = "ghafaseh.analytics.last-pageview";

/** Records one first-party page view after a real client-side navigation. */
export default function PublicAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      const previous = sessionStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (previous) {
        const [previousPath, previousAt] = previous.split("|");
        if (previousPath === pathname && now - Number(previousAt) < DEDUPE_MS) return;
      }
      sessionStorage.setItem(STORAGE_KEY, `${pathname}|${now}`);
      void fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
        credentials: "same-origin",
      });
    } catch {
      // Analytics must never affect a visitor's navigation.
    }
  }, [pathname]);

  return null;
}
