import assert from "node:assert/strict";
import { test } from "node:test";

import { getConfiguredUploadDriver } from "@/lib/server/upload-storage";

function withEnvironment(values: Record<string, string | undefined>, run: () => void) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("development uses local uploads unless S3 is explicitly requested", () => {
  withEnvironment({ NODE_ENV: "development", UPLOAD_DRIVER: undefined }, () => {
    assert.equal(getConfiguredUploadDriver(), "local");
  });
  withEnvironment({ NODE_ENV: "development", UPLOAD_DRIVER: "s3" }, () => {
    assert.equal(getConfiguredUploadDriver(), "s3");
  });
});

test("production always uses S3 even when local is configured", () => {
  withEnvironment({ NODE_ENV: "production", UPLOAD_DRIVER: "local" }, () => {
    assert.equal(getConfiguredUploadDriver(), "s3");
  });
});
