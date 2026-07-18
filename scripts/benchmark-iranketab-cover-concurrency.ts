import { monitorEventLoopDelay } from "node:perf_hooks";
import sharp from "sharp";
import { processIranKetabCover } from "@/lib/importers/iranketab/cover-processing";

const editionCounts = [1, 10, 50];
const concurrencies = [1, 2, 3, 6];

async function mapWithConcurrency<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(items.length, concurrency) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      await work(items[index]!);
    }
  }));
}

async function main() {
  // A fixed 1200×1800 JPEG gives reproducible CPU/memory comparisons without
  // accessing IranKetab or object storage. Each item represents a unique URL.
  const source = await sharp({ create: { width: 1200, height: 1800, channels: 3, background: { r: 87, g: 62, b: 47 } } }).jpeg({ quality: 92 }).toBuffer();
  console.log("editions,concurrency,durationMs,cpuMs,rssPeakBytes,heapPeakBytes,eventLoopP99Ms,sharpOperations");
  for (const editions of editionCounts) for (const concurrency of concurrencies) {
    const histogram = monitorEventLoopDelay({ resolution: 10 });
    let peakRss = 0;
    let peakHeap = 0;
    const sample = setInterval(() => {
      const memory = process.memoryUsage();
      peakRss = Math.max(peakRss, memory.rss);
      peakHeap = Math.max(peakHeap, memory.heapUsed);
    }, 5);
    const cpuBefore = process.cpuUsage();
    const started = performance.now();
    histogram.enable();
    await mapWithConcurrency(Array.from({ length: editions }), concurrency, async () => {
      await processIranKetabCover(source, "image/jpeg");
    });
    histogram.disable();
    clearInterval(sample);
    const memory = process.memoryUsage();
    peakRss = Math.max(peakRss, memory.rss);
    peakHeap = Math.max(peakHeap, memory.heapUsed);
    const cpu = process.cpuUsage(cpuBefore);
    console.log([editions, concurrency, Math.round(performance.now() - started), Math.round((cpu.user + cpu.system) / 1000), peakRss, peakHeap, (histogram.percentile(99) / 1e6).toFixed(2), editions].join(","));
  }
}

void main();
