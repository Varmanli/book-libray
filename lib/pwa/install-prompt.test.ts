import assert from "node:assert/strict";
import test from "node:test";

import {
  isIosSafari,
  isStandaloneMode,
  PWA_INSTALL_PROMPT_DISMISSED_KEY,
} from "./install-prompt";

test("the PWA install prompt uses one durable browser-scoped key", () => {
  assert.equal(
    PWA_INSTALL_PROMPT_DISMISSED_KEY,
    "ghafaseh:pwa-install-prompt-dismissed",
  );
});

test("standalone detection supports display mode and iOS navigator state", () => {
  assert.equal(isStandaloneMode(true, {}), true);
  assert.equal(isStandaloneMode(false, { standalone: true }), true);
  assert.equal(isStandaloneMode(false, {}), false);
});

test("only Safari on iOS receives manual installation instructions", () => {
  assert.equal(
    isIosSafari({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
    }),
    true,
  );
  assert.equal(
    isIosSafari({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
    }),
    false,
  );
  assert.equal(
    isIosSafari({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      platform: "Win32",
    }),
    false,
  );
});
