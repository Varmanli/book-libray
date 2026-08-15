"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboardingOverlay } from "@/components/onboarding/OnboardingProvider";
import {
  isIosSafari,
  isStandaloneMode,
  PWA_INSTALL_PROMPT_DISMISSED_KEY,
} from "@/lib/pwa/install-prompt";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type InstallPath = "chromium" | "ios";

const PROMPT_DELAY_MS = 7_000;
const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

function hasDismissedPrompt(): boolean {
  try {
    return localStorage.getItem(PWA_INSTALL_PROMPT_DISMISSED_KEY) !== null;
  } catch {
    return false;
  }
}

function persistDismissal(): void {
  try {
    localStorage.setItem(PWA_INSTALL_PROMPT_DISMISSED_KEY, "true");
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

/**
 * A non-modal, once-per-browser install suggestion. Browser-only PWA APIs are
 * intentionally isolated here so the root layout remains server-rendered.
 */
export default function PwaInstallPrompt() {
  const { isOnboardingActive } = useOnboardingOverlay();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installPath, setInstallPath] = useState<InstallPath | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const promptReady = useRef(false);
  const onboardingActiveRef = useRef(isOnboardingActive);

  useEffect(() => {
    onboardingActiveRef.current = isOnboardingActive;
    if (isOnboardingActive) {
      setIsVisible(false);
      return;
    }

    window.dispatchEvent(new Event("ghafaseh:onboarding-finished"));
  }, [isOnboardingActive]);

  useEffect(() => {
    promptReady.current = false;

    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches || hasDismissedPrompt()) {
      return;
    }

    if (
      isStandaloneMode(
        window.matchMedia("(display-mode: standalone)").matches,
        navigator,
      )
    ) {
      return;
    }

    let capturedPrompt: BeforeInstallPromptEvent | null = null;
    const iosSafari = isIosSafari(navigator);

    const revealIfEligible = () => {
      if (hasDismissedPrompt() || onboardingActiveRef.current) return;

      if (iosSafari) {
        setInstallPath("ios");
        setIsVisible(true);
      } else if (capturedPrompt) {
        setDeferredPrompt(capturedPrompt);
        setInstallPath("chromium");
        setIsVisible(true);
      }
    };

    const delay = window.setTimeout(() => {
      promptReady.current = true;
      revealIfEligible();
    }, PROMPT_DELAY_MS);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      capturedPrompt = event as BeforeInstallPromptEvent;
      if (promptReady.current) revealIfEligible();
    };

    const handleAppInstalled = () => {
      persistDismissal();
      capturedPrompt = null;
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("ghafaseh:onboarding-finished", revealIfEligible);

    return () => {
      window.clearTimeout(delay);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("ghafaseh:onboarding-finished", revealIfEligible);
    };
  }, []);

  const dismiss = () => {
    persistDismissal();
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      // Whether accepted or declined, do not interrupt the user again on this
      // browser/device. `appinstalled` also records the completed install.
      dismiss();
    }
  };

  if (!isVisible || !installPath) return null;

  const isIos = installPath === "ios";

  return (
    <aside
      dir="rtl"
      aria-label="پیشنهاد نصب قفسه"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto w-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none lg:hidden"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 p-4 text-right shadow-[0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="absolute left-2 top-2 size-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="بستن پیشنهاد نصب"
        >
          <X aria-hidden="true" />
        </Button>

        <div className="flex items-start gap-3 pl-8">
          <Image
            src="/icons/icon.png"
            alt=""
            aria-hidden="true"
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-2xl shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold tracking-tight">
              قفسه همیشه همراهت 📚
            </h2>
            {isIos ? (
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                <Share2 aria-hidden="true" className="mb-0.5 ml-1 inline size-4" />
                دکمه اشتراک‌گذاری را بزن و «افزودن به صفحه اصلی» را انتخاب کن.
              </p>
            ) : (
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                قفسه را روی گوشی نصب کن تا سریع‌تر و راحت‌تر به کتاب‌ها دسترسی داشته باشی.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {isIos ? (
            <Button type="button" onClick={dismiss} className="flex-1 font-bold">
              متوجه شدم
            </Button>
          ) : (
            <Button type="button" onClick={() => void install()} className="flex-1 font-bold">
              <Download aria-hidden="true" />
              نصب قفسه
            </Button>
          )}
          <Button type="button" variant="outline" onClick={dismiss} className="font-semibold">
            فعلاً نه
          </Button>
        </div>
      </div>
    </aside>
  );
}
