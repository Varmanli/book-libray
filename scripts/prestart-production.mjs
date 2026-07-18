import { loadScriptEnv } from "./load-script-env.mjs";

async function main() {
  const { loadedFiles } = loadScriptEnv();

  if (loadedFiles.length > 0) {
    console.log(`[prestart] loaded env files: ${loadedFiles.join(", ")}`);
  }

  console.log("[prestart] database migrations are not run automatically.");
}

void main().catch((error) => {
  console.error("[prestart] failed:", error);
  process.exit(1);
});
