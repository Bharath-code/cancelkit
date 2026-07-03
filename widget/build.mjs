import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "public/v1/cancelkit.js");
const BUDGET_BYTES = 12 * 1024;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const siteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "http://127.0.0.1:3211";

mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [join(root, "widget/src/loader.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2019",
  outfile,
  define: {
    __APP_URL__: JSON.stringify(appUrl),
    __API_URL__: JSON.stringify(siteUrl),
  },
});

const raw = readFileSync(outfile);
const gzipped = gzipSync(raw).length;
console.log(
  `cancelkit.js: ${raw.length} bytes raw, ${gzipped} bytes gzip (budget ${BUDGET_BYTES})`
);
if (gzipped > BUDGET_BYTES) {
  console.error(`FAIL: widget exceeds the 12kb gzip budget`);
  process.exit(1);
}
writeFileSync(outfile, raw); // no-op, keeps outfile timestamps sane
