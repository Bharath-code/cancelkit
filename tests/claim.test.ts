import { expect, test } from "vitest";
import { canClaim } from "../convex/widget";

const now = 1_000_000;

test("open, unclaimed session can be claimed", () => {
  expect(canClaim({ outcome: "open" }, now)).toBe(true);
});

test("a claim in flight blocks a parallel resolve", () => {
  expect(canClaim({ outcome: "open", claimedAt: now - 5_000 }, now)).toBe(false);
});

test("a stale claim (crashed resolve) expires", () => {
  expect(canClaim({ outcome: "open", claimedAt: now - 60_000 }, now)).toBe(true);
});

test("resolved or missing sessions can't be claimed", () => {
  expect(canClaim({ outcome: "canceled" }, now)).toBe(false);
  expect(canClaim(null, now)).toBe(false);
});
