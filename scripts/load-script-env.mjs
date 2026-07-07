import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const silentLogger = {
  info: () => {},
  error: (...args) => {
    console.error("[script-env] failed to load env file:", ...args);
  },
};

export function loadScriptEnv() {
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
