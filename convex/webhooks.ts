import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Atomic insert-if-absent on stripeEventId — Convex mutations are
// transactions, so check-and-insert cannot race. Returns false on duplicate.
export const tryInsertEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    stripeAccountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
      .unique();
    if (existing) return false;
    await ctx.db.insert("webhookEvents", { ...args, processedAt: Date.now() });
    return true;
  },
});

export const deleteEvent = internalMutation({
  args: { stripeEventId: v.string() },
  handler: async (ctx, { stripeEventId }) => {
    const row = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("stripeEventId", stripeEventId))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});

// subscription deleted (or reconciled to canceled): close any open sessions.
export const closeOpenSessionsForSubscription = internalMutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, { stripeSubscriptionId }) => {
    const open = await ctx.db
      .query("cancelSessions")
      .withIndex("by_subscription_outcome", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId).eq("outcome", "open")
      )
      .collect();
    for (const session of open) {
      await ctx.db.patch(session._id, {
        outcome: "canceled",
        resolvedAt: Date.now(),
      });
    }
    return null;
  },
});

export const revokeAccount = internalMutation({
  args: { stripeAccountId: v.string() },
  handler: async (ctx, { stripeAccountId }) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_account", (q) =>
        q.eq("stripeAccountId", stripeAccountId)
      )
      .unique();
    if (account) {
      await ctx.db.patch(account._id, { widgetStatus: "revoked" });
    }
    return account?._id ?? null;
  },
});
