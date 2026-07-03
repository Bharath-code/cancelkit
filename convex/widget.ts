import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { takeToken } from "./lib/rateLimit";

// Internal plumbing for the /widget/* HTTP actions.

export const getAccountByPublicKey = internalQuery({
  args: { publicKey: v.string() },
  handler: async (ctx, { publicKey }) => {
    return ctx.db
      .query("accounts")
      .withIndex("by_public_key", (q) => q.eq("publicKey", publicKey))
      .unique();
  },
});

export const recordHeartbeat = internalMutation({
  args: { publicKey: v.string() },
  handler: async (ctx, { publicKey }) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_public_key", (q) => q.eq("publicKey", publicKey))
      .unique();
    if (!account) return null;
    // killed/revoked are sticky states — a heartbeat never resurrects them
    const patch: { lastHeartbeatAt: number; widgetStatus?: "live" } = {
      lastHeartbeatAt: Date.now(),
    };
    if (
      account.widgetStatus === "not_installed" ||
      account.widgetStatus === "live"
    ) {
      patch.widgetStatus = "live";
    }
    await ctx.db.patch(account._id, patch);
    return null;
  },
});

export const takeRate = internalMutation({
  args: {
    key: v.string(),
    capacity: v.optional(v.number()),
    refillPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, { key, capacity, refillPerMinute }) => {
    return takeToken(ctx, key, capacity, refillPerMinute);
  },
});

export const createSession = internalMutation({
  args: {
    accountId: v.id("accounts"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    mrrCents: v.number(),
    currency: v.string(),
    planNickname: v.optional(v.string()),
    offerType: v.union(v.literal("pause"), v.literal("coupon")),
    offerDetail: v.string(),
    sandbox: v.boolean(),
    multiSubscription: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("cancelSessions", {
      ...args,
      outcome: "open",
      createdAt: Date.now(),
    });
  },
});

export const getSession = internalQuery({
  args: { id: v.id("cancelSessions") },
  handler: async (ctx, { id }) => {
    const session = await ctx.db.get(id);
    if (!session) return null;
    const account = await ctx.db.get(session.accountId);
    return account ? { session, account } : null;
  },
});

export const patchSession = internalMutation({
  args: {
    id: v.id("cancelSessions"),
    reason: v.optional(v.string()),
    reasonText: v.optional(v.string()),
    offerType: v.optional(v.union(v.literal("pause"), v.literal("coupon"))),
    offerDetail: v.optional(v.string()),
    outcome: v.optional(
      v.union(
        v.literal("saved_pause"),
        v.literal("saved_coupon"),
        v.literal("canceled"),
        v.literal("abandoned")
      )
    ),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    if (fields.outcome) patch.resolvedAt = Date.now();
    await ctx.db.patch(id, patch);
    return null;
  },
});
