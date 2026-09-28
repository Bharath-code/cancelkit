import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAccount } from "./lib/auth";

// Live dashboard stats (FR-011). Indexed aggregates, sandbox excluded.
export const stats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const account = await requireAccount(ctx, sessionToken);

    async function countOutcome(
      outcome: "saved_pause" | "saved_coupon" | "canceled" | "open" | "abandoned"
    ) {
      const rows = await ctx.db
        .query("cancelSessions")
        .withIndex("by_account_outcome", (q) =>
          q.eq("accountId", account._id).eq("outcome", outcome)
        )
        .collect();
      return rows.filter((r) => !r.sandbox);
    }

    const [pauses, coupons, cancels, open, abandoned] = await Promise.all([
      countOutcome("saved_pause"),
      countOutcome("saved_coupon"),
      countOutcome("canceled"),
      countOutcome("open"),
      countOutcome("abandoned"),
    ]);
    const saves = pauses.length + coupons.length;
    const savedMrrCents = [...pauses, ...coupons].reduce(
      (sum, s) => sum + s.mrrCents,
      0
    );
    const offersShown =
      saves + cancels.length + open.length + abandoned.length;

    const latest = await ctx.db
      .query("cancelSessions")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .order("desc")
      .take(200); // headroom to drop sandbox rows and still show 100

    return {
      offersShown,
      saves,
      savedMrrCents,
      cancels: cancels.length,
      saveRate: saves + cancels.length > 0 ? saves / (saves + cancels.length) : 0,
      widgetStatus:
        account.widgetStatus === "live" &&
        (account.lastHeartbeatAt ?? 0) < Date.now() - 86400_000
          ? ("silent" as const)
          : account.widgetStatus,
      recent: latest
        .filter((s) => !s.sandbox)
        .slice(0, 100)
        .map((s) => ({
          reason: s.reason,
          outcome: s.outcome,
          mrrCents: s.mrrCents,
          currency: s.currency,
          createdAt: s.createdAt,
        })),
    };
  },
});

// Previous-calendar-month digest per account, for the monthly receipt cron.
export const monthlyDigest = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const accounts = await ctx.db.query("accounts").collect();
    const digests = [];
    for (const account of accounts) {
      const sessions = (
        await ctx.db
          .query("cancelSessions")
          .withIndex("by_account", (q) =>
            q
              .eq("accountId", account._id)
              .gte("createdAt", monthStart)
              .lt("createdAt", monthEnd)
          )
          .collect()
      ).filter((s) => !s.sandbox);
      if (sessions.length === 0) continue;
      const saved = sessions.filter(
        (s) => s.outcome === "saved_pause" || s.outcome === "saved_coupon"
      );
      const reasons: Record<string, number> = {};
      for (const s of sessions) {
        if (s.reason) reasons[s.reason] = (reasons[s.reason] ?? 0) + 1;
      }
      digests.push({
        email: account.email,
        businessName: account.businessName,
        saves: saved.length,
        savedByCurrency: saved.reduce<Record<string, number>>((acc, s) => {
          acc[s.currency] = (acc[s.currency] ?? 0) + s.mrrCents;
          return acc;
        }, {}),
        reasons,
      });
    }
    return digests;
  },
});

// Cron target: open sessions older than 30 minutes → abandoned.
export const sweepAbandoned = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const stale = await ctx.db
      .query("cancelSessions")
      .withIndex("by_open_sessions", (q) =>
        q.eq("outcome", "open").lt("createdAt", cutoff)
      )
      .collect();
    for (const session of stale) {
      await ctx.db.patch(session._id, {
        outcome: "abandoned",
        resolvedAt: Date.now(),
      });
    }
    return stale.length;
  },
});

// Sandbox session log (preview surface). Live sessions are created by the
// /widget/session HTTP action in Phase 2 — sandbox sessions never call Stripe.
export const start = mutation({
  args: {
    sessionToken: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    mrrCents: v.number(),
    currency: v.string(),
    planNickname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = await requireAccount(ctx, args.sessionToken);
    return ctx.db.insert("cancelSessions", {
      accountId: account._id,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      mrrCents: args.mrrCents,
      currency: args.currency,
      planNickname: args.planNickname,
      outcome: "open",
      sandbox: true, // this surface only ever logs preview sessions
      createdAt: Date.now(),
    });
  },
});

export const patch = mutation({
  args: {
    sessionToken: v.string(),
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
  handler: async (ctx, { sessionToken, id, ...fields }) => {
    const account = await requireAccount(ctx, sessionToken);
    const session = await ctx.db.get(id);
    if (!session || session.accountId !== account._id) {
      throw new ConvexError({ code: "not_found" });
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    if (fields.outcome) patch.resolvedAt = Date.now();
    await ctx.db.patch(id, patch);
    return null;
  },
});
