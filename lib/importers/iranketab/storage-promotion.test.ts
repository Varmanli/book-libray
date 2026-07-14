import assert from "node:assert/strict";
import test from "node:test";
import {
  promoteObjects,
  type StorageAdapter,
  type StorageObject,
} from "./storage-promotion";

function fake(failCopy?: string) {
  const objects = new Map<string, StorageObject>([
    [
      "tmp/one",
      {
        key: "tmp/one",
        contentType: "image/webp",
        metadata: { source: "kept" },
      },
    ],
    ["tmp/two", { key: "tmp/two", contentType: "image/webp", metadata: {} }],
  ]);
  const adapter: StorageAdapter = {
    async headObject(key) {
      return objects.get(key) ?? null;
    },
    async copyObject(source, destination, metadata) {
      if (destination === failCopy) throw new Error("provider failure");
      const value = objects.get(source);
      if (!value) throw new Error("missing");
      objects.set(destination, { ...value, key: destination, metadata });
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
  return { adapter, objects };
}

test("fake headObject covers existing, missing, and provider failure", async () => {
  const { adapter } = fake();
  assert.ok(await adapter.headObject("tmp/one"));
  assert.equal(await adapter.headObject("missing"), null);
  await assert.rejects(
    {
      ...adapter,
      headObject: async (_key: string) => {
        throw new Error("provider");
      },
    }.headObject("x"),
  );
});

test("copy preserves metadata and never mutates its source", async () => {
  const { adapter, objects } = fake();
  await promoteObjects(adapter, [
    {
      sourceKey: "tmp/one",
      destinationKey: "covers/iranketab-one.webp",
      metadata: { fingerprint: "x" },
    },
  ]);
  assert.deepEqual(objects.get("covers/iranketab-one.webp")?.metadata, {
    source: "kept",
    fingerprint: "x",
  });
  assert.ok(objects.has("tmp/one"));
  await assert.rejects(
    promoteObjects(adapter, [
      { sourceKey: "tmp/one", destinationKey: "wrong/path", metadata: {} },
    ]),
  );
});

test("multi-cover failure compensates successful promotions and leaves sources", async () => {
  const { adapter, objects } = fake("covers/iranketab-two.webp");
  await assert.rejects(
    promoteObjects(adapter, [
      {
        sourceKey: "tmp/one",
        destinationKey: "covers/iranketab-one.webp",
        metadata: {},
      },
      {
        sourceKey: "tmp/two",
        destinationKey: "covers/iranketab-two.webp",
        metadata: {},
      },
    ]),
  );
  assert.equal(objects.has("covers/iranketab-one.webp"), false);
  assert.ok(objects.has("tmp/one"));
  assert.ok(objects.has("tmp/two"));
});
