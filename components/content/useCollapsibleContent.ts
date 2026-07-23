"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefCallback,
} from "react";

const PREVIEW_HEIGHT_PX = 96;

export function useCollapsibleContent(): {
  contentRef: RefCallback<HTMLDivElement>;
  isExpandable: boolean;
  isExpanded: boolean;
  isCollapsed: boolean;
  toggleExpanded: () => void;
} {
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [isExpandable, setIsExpandable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentRef = useCallback<RefCallback<HTMLDivElement>>((element) => {
    setContentElement(element);
  }, []);

  useLayoutEffect(() => {
    if (!contentElement) return;

    const measure = () => {
      const nextIsExpandable =
        contentElement.scrollHeight > PREVIEW_HEIGHT_PX + 1;

      setIsExpandable(nextIsExpandable);

      if (!nextIsExpandable) {
        setIsExpanded(false);
      }
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(contentElement);

    return () => resizeObserver.disconnect();
  }, [contentElement]);

  const toggleExpanded = useCallback(() => {
    if (isExpandable) {
      setIsExpanded((current) => !current);
    }
  }, [isExpandable]);

  return {
    contentRef,
    isExpandable,
    isExpanded,
    isCollapsed: isExpandable && !isExpanded,
    toggleExpanded,
  };
}
