"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useCollapsibleContent } from "@/components/content/useCollapsibleContent";

/**
 * A measured, accessible long-content preview shared by public content areas.
 * It only renders its toggle when the rendered content exceeds the preview.
 */
export default function CollapsibleContent({
  children,
  className,
  contentClassName,
  fadeClassName,
  expandLabel = "بیشتر بخوانید",
  collapseLabel = "نمایش کمتر",
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  fadeClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const contentId = useId();
  const { contentRef, isExpandable, isExpanded, isCollapsed, toggleExpanded } =
    useCollapsibleContent();

  return (
    <div className={className}>
      <div
        id={contentId}
        className={cn(
          "relative transition-all duration-300",
          isCollapsed
            ? "max-h-24 overflow-hidden"
            : "max-h-none overflow-visible",
          contentClassName,
        )}
      >
        <div ref={contentRef}>{children}</div>
        {isCollapsed ? (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/90 via-card/50 to-transparent",
              fadeClassName,
            )}
          />
        ) : null}
      </div>

      {isExpandable ? (
        <div className="mt-3 border-t border-border/30 pt-2 text-center">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-controls={contentId}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {isExpanded ? collapseLabel : expandLabel}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isExpanded && "rotate-180",
              )}
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}
