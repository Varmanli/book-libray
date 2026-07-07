import { loadEnvConfig } from "@next/env";

type ScriptEnvLoadResult = {
  loadedFiles: string[];
};

const silentLogger = {
  info: () => {},
  error: (...args: unknown[]) => {
    console.error("[script-env] failed to load env file:", ...args);
  },
};

export function loadScriptEnv(): ScriptEnvLoadResult {
  const { loadedEnvFiles } = loadEnvConfig(
    process.cwd(),
    false,
    silentLogger,
    true,
  );

  return {
    loadedFiles: loadedEnvFiles.map((file) => file.path),
  };
}
