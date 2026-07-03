import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Dev/test helpers — internal-only, used via `npx convex run` for local
// verification without a live Stripe connection.

export const seedTestAccount = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_account", (q) =>
        q.eq("stripeAccountId", "acct_devtest")
      )
      .unique();
    if (existing) {
      if (!existing.email) {
        await ctx.db.patch(existing._id, { email: "founder@example.com" });
      }
      return existing._id;
    }
    return ctx.db.insert("accounts", {
      stripeAccountId: "acct_devtest",
      businessName: "Dev Test Co",
      publicKey: "ck_pub_devtest000000000000",
      widgetSecret:
        "devsecret_devsecret_devsecret_devsecret_devsecret_devsecret1234",
      offerConfig: { pauseDays: 30 },
      widgetStatus: "not_installed",
      createdAt: Date.now(),
    });
  },
});

export const resetTestSecret = internalMutation({
  args: {},
  handler: async (ctx) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_account", (q) =>
        q.eq("stripeAccountId", "acct_devtest")
      )
      .unique();
    if (account) {
      await ctx.db.patch(account._id, {
        widgetSecret:
          "devsecret_devsecret_devsecret_devsecret_devsecret_devsecret1234",
      });
    }
    return null;
  },
});

export const seedOldOpenSession = internalMutation({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    return ctx.db.insert("cancelSessions", {
      accountId,
      stripeCustomerId: "cus_stale",
      stripeSubscriptionId: "sub_stale",
      mrrCents: 900,
      currency: "usd",
      outcome: "open",
      sandbox: true,
      createdAt: Date.now() - 45 * 60 * 1000, // 45 min ago
    });
  },
});

export const seedLiveSave = internalMutation({
  args: { accountId: v.id("accounts"), createdAt: v.optional(v.number()) },
  handler: async (ctx, { accountId, createdAt }) => {
    return ctx.db.insert("cancelSessions", {
      accountId,
      stripeCustomerId: "cus_live1",
      stripeSubscriptionId: "sub_live1",
      mrrCents: 9900,
      currency: "usd",
      planNickname: "Pro",
      reason: "too_expensive",
      offerType: "pause",
      offerDetail: "pause_30d",
      outcome: "saved_pause",
      sandbox: false,
      createdAt: createdAt ?? Date.now(),
      resolvedAt: createdAt ?? Date.now(),
    });
  },
});

export const seedBilling = internalMutation({
  args: {
    accountId: v.id("accounts"),
    status: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("paused"),
      v.literal("canceled")
    ),
    ageDays: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, status, ageDays }) => {
    const updatedAt = Date.now() - (ageDays ?? 0) * 86400_000;
    const existing = await ctx.db
      .query("billing")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { status, updatedAt });
      return existing._id;
    }
    return ctx.db.insert("billing", {
      accountId,
      stripeCustomerId: "cus_platform_dev",
      stripeSubscriptionId: "sub_platform_dev",
      status,
      priceId: "price_dev",
      updatedAt,
    });
  },
});

export const listSessions = internalQuery({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    return ctx.db
      .query("cancelSessions")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .collect();
  },
});
