#!/usr/bin/env npx tsx
// Operator script: create a /demo/[slug] page from public info.
//
// Usage:
//   npx tsx scripts/create-demo.ts acme "Acme Analytics" \
//     --color "#4353FF" --logo "https://acme.com/logo.png" \
//     --plan "Pro:7900:month" --plan "Starter:2900:month" \
//     --coupon "SAVE20:20"
//
// Plans are nickname:cents:interval; coupons are id:percentOff.
// Writes via `npx convex run demos:create` against the current deployment.

import { execFileSync } from "node:child_process";

const [slug, name, ...rest] = process.argv.slice(2);
if (!slug || !name) {
  console.error("usage: create-demo.ts <slug> <name> [--color hex] [--logo url] [--plan nickname:cents:interval]... [--coupon id:percentOff]...");
  process.exit(1);
}

const plans: object[] = [];
const coupons: object[] = [];
let brandColor: string | undefined;
let logoUrl: string | undefined;

for (let i = 0; i < rest.length; i += 2) {
  const [flag, value] = [rest[i], rest[i + 1]];
  if (flag === "--color") brandColor = value;
  if (flag === "--logo") logoUrl = value;
  if (flag === "--plan") {
    const [nickname, cents, interval] = value.split(":");
    plans.push({
      nickname,
      amountCents: Number(cents),
      currency: "usd",
      interval: interval || "month",
    });
  }
  if (flag === "--coupon") {
    const [id, percentOff] = value.split(":");
    coupons.push({
      id,
      name: id,
      percentOff: Number(percentOff),
      duration: "repeating",
    });
  }
}

if (plans.length === 0) {
  plans.push({ nickname: "Pro", amountCents: 4900, currency: "usd", interval: "month" });
}

const args = JSON.stringify({ slug, name, brandColor, logoUrl, plans, coupons });
execFileSync("npx", ["convex", "run", "demos:create", args], { stdio: "inherit" });
console.log(`\nDemo ready: /demo/${slug}`);
