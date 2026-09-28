import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAccount } from "./lib/auth";
import { stripeClient } from "./lib/stripeClient";
import { computeHmac, signedMessage } from "./lib/hmac";

// CancelKit's own billing lives on the PLATFORM Stripe account — no
// Stripe-Account header anywhere in this file.

export const current = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const account = await requireAccount(ctx, sessionToken);
    const row = await ctx.db
      .query("billing")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .unique();
    return row
      ? {
          status: row.status,
          stripeSubscriptionId: row.stripeSubscriptionId,
          updatedAt: row.updatedAt,
        }
      : null;
  },
});

export const getByAccount = internalQuery({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    return ctx.db
      .query("billing")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .unique();
  },
});

// Webhooks resolve billing rows by platform customer id. Row count is tiny
// (one per paying account); a scan is fine at MVP scale.
export const getByPlatformCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    const rows = await ctx.db.query("billing").collect();
    return rows.find((r) => r.stripeCustomerId === stripeCustomerId) ?? null;
  },
});

export const upsertStatus = internalMutation({
  args: {
    accountId: v.id("accounts"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("paused"),
      v.literal("canceled")
    ),
    priceId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("billing")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .unique();
    if (existing) {
      const statusChanged = existing.status !== args.status;
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return { id: existing._id, statusChanged, previous: existing.status };
    }
    const id = await ctx.db.insert("billing", { ...args, updatedAt: Date.now() });
    return { id, statusChanged: true, previous: "none" as const };
  },
});

export const patchStatusByCustomer = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("paused"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, { stripeCustomerId, status }) => {
    const rows = await ctx.db.query("billing").collect();
    const row = rows.find((r) => r.stripeCustomerId === stripeCustomerId);
    if (!row) return null;
    const statusChanged = row.status !== status;
    await ctx.db.patch(row._id, { status, updatedAt: Date.now() });
    return { accountId: row.accountId, statusChanged, previous: row.status };
  },
});

export const createCheckout = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ url: string }> => {
    const account = await ctx.runQuery(internal.accounts.getForSession, {
      sessionToken,
    });
    const priceId = process.env.STRIPE_FOUNDER_PRICE_ID;
    const appUrl = process.env.APP_URL;
    if (!priceId || !appUrl) throw new ConvexError({ code: "misconfigured" });

    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: account._id,
      customer_email: account.email,
      success_url: `${appUrl}/billing?status=success`,
      cancel_url: `${appUrl}/billing`,
    });
    if (!session.url) throw new ConvexError({ code: "stripe_error" });
    return { url: session.url };
  },
});

export const createPortal = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<{ url: string }> => {
    const account = await ctx.runQuery(internal.accounts.getForSession, {
      sessionToken,
    });
    const billing = await ctx.runQuery(internal.billing.getByAccount, {
      accountId: account._id,
    });
    const appUrl = process.env.APP_URL;
    if (!billing || !appUrl) throw new ConvexError({ code: "not_found" });

    const stripe = stripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });
    return { url: portal.url };
  },
});

// Plan card data: status from the billing row, next invoice from Stripe.
export const overview = action({
  args: { sessionToken: v.string() },
  handler: async (
    ctx,
    { sessionToken }
  ): Promise<{
    status: string;
    priceCents: number;
    nextInvoiceAt: number | null;
  } | null> => {
    const account = await ctx.runQuery(internal.accounts.getForSession, {
      sessionToken,
    });
    const billing = await ctx.runQuery(internal.billing.getByAccount, {
      accountId: account._id,
    });
    if (!billing || billing.status === "none") return null;
    let nextInvoiceAt: number | null = null;
    let priceCents = 2400;
    if (billing.stripeSubscriptionId) {
      try {
        const sub = await stripeClient().subscriptions.retrieve(
          billing.stripeSubscriptionId
        );
        priceCents = sub.items.data[0]?.price?.unit_amount ?? priceCents;
        const until = sub.items.data[0]?.current_period_end;
        nextInvoiceAt = until ? until * 1000 : null;
      } catch {
        // Stripe unreachable — show status without the invoice date
      }
    }
    return { status: billing.status, priceCents, nextInvoiceAt };
  },
});

// Params for the dogfooded cancel: CancelKit's own embed pointed at the
// reserved self-account, HMAC computed server-side (PRD § 10).
// A mutation, not a query: the signature's timestamp must be fresh at click
// time, and query results are cached.
export const selfEmbedParams = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const account = await requireAccount(ctx, sessionToken);
    const billing = await ctx.db
      .query("billing")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .unique();
    if (!billing || billing.status === "none") return null;
    const self = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_account", (q) => q.eq("stripeAccountId", "self"))
      .unique();
    if (!self) return null;
    const ts = Math.floor(Date.now() / 1000);
    return {
      publicKey: self.publicKey,
      customerId: billing.stripeCustomerId,
      ts,
      hmac: await computeHmac(
        signedMessage(billing.stripeCustomerId, ts),
        self.widgetSecret
      ),
    };
  },
});

// One-time seed for the reserved self-account (run once per deployment).
export const seedSelfAccount = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_account", (q) => q.eq("stripeAccountId", "self"))
      .unique();
    if (existing) return existing._id;
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    const secret = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    const buf2 = new Uint8Array(12);
    crypto.getRandomValues(buf2);
    const pk = Array.from(buf2, (b) => b.toString(16).padStart(2, "0")).join("");
    return ctx.db.insert("accounts", {
      stripeAccountId: "self", // sentinel: Stripe calls omit Stripe-Account
      businessName: "CancelKit",
      publicKey: `ck_pub_${pk}`,
      widgetSecret: secret,
      offerConfig: { pauseDays: 30 },
      widgetStatus: "live",
      createdAt: Date.now(),
    });
  },
});
