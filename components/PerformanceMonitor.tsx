"use client";

import { useEffect } from "react";

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  lastInputTime: number;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect?: DOMRectReadOnly;
  currentRect?: DOMRectReadOnly;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case "largest-contentful-paint": {
            const lcpEntry = entry as PerformancePaintTiming;
            console.log("LCP:", lcpEntry.startTime);
            break;
          }
          case "first-input": {
            const fiEntry = entry as PerformanceEventTiming;
            console.log("FID:", fiEntry.processingStart - fiEntry.startTime);
            break;
          }
          case "layout-shift": {
            const lsEntry = entry as LayoutShift;
            console.log("CLS:", lsEntry.value);
            break;
          }
        }
      }
    });

    observer.observe({
      entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
    });

    // Navigation timings
    const navigationEntries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];

    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      console.log(
        "Page Load Time:",
        navEntry.loadEventEnd - navEntry.loadEventStart
      );
      console.log(
        "DOM Content Loaded:",
        navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
      );
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}




