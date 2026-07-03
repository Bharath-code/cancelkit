import { expect, test } from "vitest";
import {
  computeHmac,
  timingSafeEqualHex,
  verifyHmac,
} from "../convex/lib/hmac";
import { refillBucket } from "../convex/lib/rateLimit";

const SECRET = "widget-secret-abc";

test("valid HMAC verifies", async () => {
  const hmac = await computeHmac("cus_123", SECRET);
  expect(hmac).toMatch(/^[0-9a-f]{64}$/);
  expect(await verifyHmac("cus_123", hmac, SECRET)).toBe(true);
  expect(await verifyHmac("cus_123", hmac.toUpperCase(), SECRET)).toBe(true);
});

test("invalid HMAC rejected", async () => {
  const hmac = await computeHmac("cus_123", SECRET);
  expect(await verifyHmac("cus_456", hmac, SECRET)).toBe(false);
  expect(await verifyHmac("cus_123", hmac, "wrong-secret")).toBe(false);
  expect(await verifyHmac("cus_123", "deadbeef", SECRET)).toBe(false);
  expect(timingSafeEqualHex("abc", "abd")).toBe(false);
  expect(timingSafeEqualHex("abc", "abcd")).toBe(false);
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
