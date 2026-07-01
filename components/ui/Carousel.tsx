"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lightweight RTL-aware carousel built on embla-carousel.
 * Controls are rendered on the left/right sides of the carousel viewport.
 */
export function Carousel({
  slides,
  slideClassName,
  className,
  containerClassName,
  ariaLabel,
  align = "start",
  controls = true,
}: {
  slides: ReactNode[];
  slideClassName?: string;
  className?: string;
  containerClassName?: string;
  ariaLabel?: string;
  align?: EmblaOptionsType["align"];
  controls?: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    align,
    containScroll: "trimSnaps",
    dragFree: false,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const showControls = controls && (canPrev || canNext);

  return (
    <div className={cn("relative", className)}>
      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        <div className={cn("flex gap-7", containerClassName)}>
          {slides.map((slide, index) => (
            <div
              key={index}
              className={cn("min-w-0 shrink-0 grow-0", slideClassName)}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {showControls ? (
        <>
          <CarouselButton
            label="قبلی"
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
            className="right-1 translate-x-1/2"
          >
            <ChevronRight className="h-4 w-4" />
          </CarouselButton>

          <CarouselButton
            label="بعدی"
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
            className="left-1 -translate-x-1/2"
          >
            <ChevronLeft className="h-4 w-4" />
          </CarouselButton>
        </>
      ) : null}
    </div>
  );
}

function CarouselButton({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex",
        className,
      )}
    >
      {children}
    </button>
  );
}
