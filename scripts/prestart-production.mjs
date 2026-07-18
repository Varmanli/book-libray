import { spawn } from "node:child_process";

import { loadScriptEnv } from "./load-script-env.mjs";

async function runMigrations() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/run-production-migrations.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`production migration gate exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const { loadedFiles } = loadScriptEnv();

  if (loadedFiles.length > 0) {
    console.log(`[prestart] loaded env files: ${loadedFiles.join(", ")}`);
  }

  console.log("[prestart] applying database migrations...");
  await runMigrations();
  console.log("[prestart] migrations completed; legacy production repair is intentionally disabled.");
}

void main().catch((error) => {
  console.error("[prestart] failed:", error);
  process.exit(1);
});
