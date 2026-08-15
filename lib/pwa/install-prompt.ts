export const PWA_INSTALL_PROMPT_DISMISSED_KEY =
  "ghafaseh:pwa-install-prompt-dismissed";

type IosNavigator = {
  maxTouchPoints?: number;
  platform?: string;
  userAgent: string;
};

export function isStandaloneMode(
  displayModeIsStandalone: boolean,
  navigator: unknown,
): boolean {
  return (
    displayModeIsStandalone ||
    (typeof navigator === "object" &&
      navigator !== null &&
      "standalone" in navigator &&
      navigator.standalone === true)
  );
}

/**
 * iPadOS can identify as macOS, so touch-capable MacIntel devices are included.
 * Chrome, Firefox, Edge and in-app browsers on iOS have different install
 * paths and must not receive Safari's Add to Home Screen instructions.
 */
export function isIosSafari(navigator: IosNavigator): boolean {
  const isIosDevice =
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);
  const isAlternativeBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(
    navigator.userAgent,
  );

  return isIosDevice && /Safari/i.test(navigator.userAgent) && !isAlternativeBrowser;
}
