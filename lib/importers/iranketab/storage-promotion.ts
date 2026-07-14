export type StorageObject = {
  key: string;
  contentType: string | null;
  metadata: Record<string, string>;
};
export type StorageAdapter = {
  headObject(key: string): Promise<StorageObject | null>;
  copyObject(
    sourceKey: string,
    destinationKey: string,
    metadata: Record<string, string>,
  ): Promise<void>;
  deleteObject(key: string): Promise<void>;
};

export async function promoteObjects(
  adapter: StorageAdapter,
  items: Array<{
    sourceKey: string;
    destinationKey: string;
    metadata: Record<string, string>;
  }>,
): Promise<string[]> {
  const created: string[] = [];
  try {
    for (const item of items) {
      if (!item.destinationKey.startsWith("covers/iranketab-"))
        throw new Error("WRONG_DESTINATION");
      const source = await adapter.headObject(item.sourceKey);
      if (!source) throw new Error("SOURCE_MISSING");
      const existing = await adapter.headObject(item.destinationKey);
      if (existing) continue;
      await adapter.copyObject(item.sourceKey, item.destinationKey, {
        ...source.metadata,
        ...item.metadata,
      });
      created.push(item.destinationKey);
    }
    return created;
  } catch (error) {
    await Promise.allSettled(created.map((key) => adapter.deleteObject(key)));
    throw error;
  }
}
