import assert from "node:assert/strict";
import test from "node:test";

import { resolveBrandLogoUrls } from "./types";

test("brand logos preserve the legacy single-logo configuration", () => {
  assert.deepEqual(
    resolveBrandLogoUrls({
      logoUrl: "/legacy-logo.svg",
      logoLightUrl: "",
      logoDarkUrl: "",
    }),
    { lightLogoUrl: "/legacy-logo.svg", darkLogoUrl: "/legacy-logo.svg" },
  );
});

test("brand logos select independent light and dark assets", () => {
  assert.deepEqual(
    resolveBrandLogoUrls({
      logoUrl: "/legacy-logo.svg",
      logoLightUrl: "/light-logo.svg",
      logoDarkUrl: "/dark-logo.svg",
    }),
    { lightLogoUrl: "/light-logo.svg", darkLogoUrl: "/dark-logo.svg" },
  );
});

test("a single theme-specific logo safely falls back for the other theme", () => {
  assert.deepEqual(
    resolveBrandLogoUrls({ logoUrl: "", logoLightUrl: "/light-logo.svg", logoDarkUrl: "" }),
    { lightLogoUrl: "/light-logo.svg", darkLogoUrl: "/light-logo.svg" },
  );
  assert.deepEqual(
    resolveBrandLogoUrls({ logoUrl: "", logoLightUrl: "", logoDarkUrl: "/dark-logo.svg" }),
    { lightLogoUrl: "/dark-logo.svg", darkLogoUrl: "/dark-logo.svg" },
  );
});

test("brand logos retain the bundled default when no custom asset exists", () => {
  assert.deepEqual(
    resolveBrandLogoUrls({ logoUrl: "", logoLightUrl: "", logoDarkUrl: "" }),
    { lightLogoUrl: "/logo.svg", darkLogoUrl: "/logo.svg" },
  );
});
