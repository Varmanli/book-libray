import dns from "node:dns";
import net from "node:net";
import tls from "node:tls";

import { checkStorageConnectivity } from "@/lib/server/s3";
import { pool } from "@/db";

// تست اتصال به فضای ذخیره‌سازی + تشخیص شبکه، بدون افشای رازها.
// اجرا (از همان محیطِ اجرای برنامه): npm run storage:check

function hostFromEndpoint(): string {
  const ep = process.env.S3_ENDPOINT;
  if (!ep) return "";
  try {
    return new URL(ep).host;
  } catch {
    return "";
  }
}

function tcpConnect(address: string, family: number): Promise<string> {
  return new Promise((resolve) => {
    const t = Date.now();
    const sock = net.connect({ host: address, port: 443, family });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve("TIMEOUT(>10000ms)");
    }, 10000);
    sock.on("connect", () => {
      clearTimeout(timer);
      sock.end();
      resolve(`OK ${Date.now() - t}ms`);
    });
    sock.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve(`ERR ${e.code} ${Date.now() - t}ms`);
    });
  });
}

function tlsHandshake(host: string): Promise<string> {
  return new Promise((resolve) => {
    const t = Date.now();
    const sock = tls.connect({ host, port: 443, servername: host }, () => {
      const proto = sock.getProtocol();
      sock.end();
      resolve(`OK ${Date.now() - t}ms (${proto})`);
    });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve("TIMEOUT(>15000ms)");
    }, 15000);
    sock.on("secureConnect", () => clearTimeout(timer));
    sock.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve(`ERR ${e.code} ${Date.now() - t}ms`);
    });
  });
}

async function networkDiag() {
  const host = hostFromEndpoint();
  console.log("Runtime:");
  console.log("  node           :", process.version);
  console.log("  platform/arch  :", `${process.platform}/${process.arch}`);
  console.log("  dns order      :", dns.getDefaultResultOrder?.() ?? "(n/a)");
  console.log(
    "  proxy env      :",
    ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"]
      .map((k) => `${k}=${process.env[k] ?? process.env[k.toLowerCase()] ?? "-"}`)
      .join(" "),
  );

  if (!host) {
    console.log("\n(no S3_ENDPOINT host to diagnose)");
    return;
  }

  console.log(`\nDNS for ${host}:`);
  const all = await dns.promises
    .lookup(host, { all: true, verbatim: true })
    .catch((e: NodeJS.ErrnoException) => {
      console.log("  lookup FAILED:", e.code);
      return [] as { address: string; family: number }[];
    });
  for (const a of all) {
    console.log(`  ${a.family === 6 ? "IPv6" : "IPv4"}  ${a.address}`);
  }

  console.log("\nTCP connect (port 443):");
  for (const a of all) {
    const r = await tcpConnect(a.address, a.family);
    console.log(`  ${a.family === 6 ? "IPv6" : "IPv4"} ${a.address} -> ${r}`);
  }

  console.log("\nTLS handshake:");
  console.log("  ", await tlsHandshake(host));
}

async function main() {
  await networkDiag();

  console.log("\nStorage SDK check:");
  const result = await checkStorageConnectivity();
  console.log("  endpointHost   :", result.endpointHost);
  console.log("  bucket         :", result.bucket);
  console.log("  forcePathStyle :", result.forcePathStyle);
  for (const s of result.steps) {
    console.log(
      `  ${s.step.padEnd(12)} : ${s.ok ? "OK" : "FAIL"} (${s.durationMs}ms)${
        s.code ? ` [${s.code}]` : ""
      }`,
    );
  }
  if (result.publicUrl) console.log("  publicUrl      :", result.publicUrl);
  console.log(result.ok ? "\n✅ Storage reachable" : "\n❌ Storage NOT reachable");

  await pool.end().catch(() => {});
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
