import { expect, test } from "vitest";
import {
  computeHmac,
  HMAC_TTL_SECONDS,
  signedMessage,
  timingSafeEqualHex,
  verifyHmac,
} from "../convex/lib/hmac";
import { refillBucket } from "../convex/lib/rateLimit";

const SECRET = "widget-secret-abc";

const NOW = 1_800_000_000;
const sign = (cus: string, ts: number, secret = SECRET) =>
  computeHmac(signedMessage(cus, ts), secret);

test("valid HMAC verifies", async () => {
  const hmac = await sign("cus_123", NOW);
  expect(hmac).toMatch(/^[0-9a-f]{64}$/);
  expect(await verifyHmac("cus_123", NOW, hmac, SECRET, NOW)).toBe(true);
  expect(await verifyHmac("cus_123", NOW, hmac.toUpperCase(), SECRET, NOW)).toBe(true);
});

test("invalid HMAC rejected", async () => {
  const hmac = await sign("cus_123", NOW);
  expect(await verifyHmac("cus_456", NOW, hmac, SECRET, NOW)).toBe(false);
  expect(await verifyHmac("cus_123", NOW, hmac, "wrong-secret", NOW)).toBe(false);
  expect(await verifyHmac("cus_123", NOW, "deadbeef", SECRET, NOW)).toBe(false);
  expect(await verifyHmac("cus_123", NOW + 1, hmac, SECRET, NOW)).toBe(false);
  expect(timingSafeEqualHex("abc", "abd")).toBe(false);
  expect(timingSafeEqualHex("abc", "abcd")).toBe(false);
});

test("HMAC expires after the TTL and rejects future timestamps", async () => {
  const hmac = await sign("cus_123", NOW);
  expect(await verifyHmac("cus_123", NOW, hmac, SECRET, NOW + HMAC_TTL_SECONDS)).toBe(true);
  expect(await verifyHmac("cus_123", NOW, hmac, SECRET, NOW + HMAC_TTL_SECONDS + 1)).toBe(false);
  const future = await sign("cus_123", NOW + 3600);
  expect(await verifyHmac("cus_123", NOW + 3600, future, SECRET, NOW)).toBe(false);
});

test("bucket exhausts and refills", () => {
  const capacity = 60;
  let tokens = capacity;
  const t0 = 1_000_000;
  // burn all 60
  for (let i = 0; i < 60; i++) {
    tokens = refillBucket(tokens, t0, t0, capacity, 60) - 1;
  }
  expect(tokens).toBeLessThan(1);
  // 1 second later → 1 token refilled
  expect(refillBucket(tokens, t0, t0 + 1000, capacity, 60)).toBeGreaterThanOrEqual(1);
  // a full minute later → back at capacity
  expect(refillBucket(0, t0, t0 + 60_000, capacity, 60)).toBe(capacity);
  // never exceeds capacity
  expect(refillBucket(50, t0, t0 + 600_000, capacity, 60)).toBe(capacity);
});
