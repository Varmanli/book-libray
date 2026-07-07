import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { loadScriptEnv } from "./load-script-env";

const require = createRequire(import.meta.url);
const tsxCliPath = require.resolve("tsx/cli");

async function runFeaturedRepair() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [tsxCliPath, "scripts/repair-featured-book-integrity.ts"],
      {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env },
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`featured repair exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const { loadedFiles } = loadScriptEnv();

  if (loadedFiles.length > 0) {
    console.log(`[prestart] loaded env files: ${loadedFiles.join(", ")}`);
  }

  console.log("[prestart] running featured book integrity repair...");
  await runFeaturedRepair();
  console.log("[prestart] completed.");
}

void main().catch((error) => {
  console.error("[prestart] failed:", error);
  process.exit(1);
});
