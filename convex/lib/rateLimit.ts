import { MutationCtx } from "../_generated/server";

// Pure token-bucket math — unit-testable. Refills continuously.
export function refillBucket(
  tokens: number,
  lastUpdatedAt: number,
  now: number,
  capacity: number,
  refillPerMinute: number
): number {
  const elapsed = Math.max(0, now - lastUpdatedAt);
  return Math.min(capacity, tokens + (elapsed / 60_000) * refillPerMinute);
}

// Take one token for `key`. Returns false when rate limited.
// Default: 60 req/min/account (PRD § NFR Security).
export async function takeToken(
  ctx: MutationCtx,
  key: string,
  capacity = 60,
  refillPerMinute = 60
): Promise<boolean> {
  const now = Date.now();
  const row = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  const tokens = row
    ? refillBucket(row.tokens, row.updatedAt, now, capacity, refillPerMinute)
    : capacity;
  if (tokens < 1) {
    if (row) await ctx.db.patch(row._id, { tokens, updatedAt: now });
    return false;
  }
  if (row) {
    await ctx.db.patch(row._id, { tokens: tokens - 1, updatedAt: now });
  } else {
    await ctx.db.insert("rateLimits", {
      key,
      tokens: tokens - 1,
      updatedAt: now,
    });
  }
  return true;
}
