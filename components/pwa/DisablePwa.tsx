"use client";

import { useEffect } from "react";

export default function DisablePwa() {
  useEffect(() => {
    async function disablePwa() {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(async (registration) => {
              try {
                await registration.unregister();
              } catch {
                // Ignore unregister failures.
              }
            }),
          );
        }

        if ("caches" in window) {
          const keys = await window.caches.keys();
          await Promise.all(
            keys.map(async (key) => {
              try {
                await window.caches.delete(key);
              } catch {
                // Ignore cache deletion failures.
              }
            }),
          );
        }

        if (process.env.NODE_ENV !== "production") {
          console.info("[pwa] service workers unregistered and caches cleared");
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[pwa] disable failed", error);
        }
      }
    }

    void disablePwa();
  }, []);

  return null;
}
