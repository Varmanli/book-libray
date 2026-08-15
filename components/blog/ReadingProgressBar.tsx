"use client";

import { useEffect, useState } from "react";

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function ReadingProgressBar({
  targetId,
}: {
  targetId: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number | null = null;

    const update = () => {
      frame = null;
      const article = document.getElementById(targetId);
      if (!article) {
        setProgress(0);
        return;
      }

      const { top, height } = article.getBoundingClientRect();
      const scrollableHeight = Math.max(height - window.innerHeight, 1);
      setProgress(clamp((-top / scrollableHeight) * 100));
    };

    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      id="reading-progress-bar"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[1000] h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
