import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One row per connected founder account. Created at OAuth callback.
  accounts: defineTable({
    stripeAccountId: v.string(), // acct_... (unique, indexed)
    businessName: v.string(), // from Stripe account object
    logoUrl: v.optional(v.string()), // Stripe branding file, resolved to URL
    brandColor: v.optional(v.string()), // hex from Stripe branding
    email: v.optional(v.string()), // account email from Stripe
    publicKey: v.string(), // ck_pub_... shown in script tag (unique, indexed)
    widgetSecret: v.string(), // HMAC key for customer verification (rotatable)
    offerConfig: v.object({
      pauseDays: v.number(), // default 30
      couponId: v.optional(v.string()), // founder's chosen Stripe coupon; default = best valid coupon
    }),
    widgetStatus: v.union(
      v.literal("not_installed"), // no heartbeat seen yet
      v.literal("live"), // heartbeat seen in last 24h
      v.literal("killed"), // kill switch engaged by founder
      v.literal("revoked") // Stripe access deauthorized
    ),
    lastHeartbeatAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_stripe_account", ["stripeAccountId"])
    .index("by_public_key", ["publicKey"]),

  // The data moat. One row per cancel-flow session, saved or not.
  cancelSessions: defineTable({
    accountId: v.id("accounts"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    mrrCents: v.number(), // subscription value at session start
    currency: v.string(), // ISO code from the subscription
    planNickname: v.optional(v.string()),
    reason: v.optional(v.string()), // enum string from REASONS list; set when chosen
    reasonText: v.optional(v.string()), // free text when reason === "other"
    offerType: v.optional(v.union(v.literal("pause"), v.literal("coupon"))),
    offerDetail: v.optional(v.string()), // "pause_30d" | coupon id
    outcome: v.union(
      v.literal("open"), // session started
      v.literal("saved_pause"),
      v.literal("saved_coupon"),
      v.literal("canceled"),
      v.literal("abandoned") // closed without resolving; swept after 30 min
    ),
    sandbox: v.boolean(), // true for preview sessions — excluded from stats
    multiSubscription: v.optional(v.boolean()), // customer had 2+ active subs (PRD § 11)
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_account", ["accountId", "createdAt"])
    .index("by_account_outcome", ["accountId", "outcome"])
    .index("by_open_sessions", ["outcome", "createdAt"]), // for the abandon sweeper

  // Webhook idempotency ledger.
  webhookEvents: defineTable({
    stripeEventId: v.string(), // evt_... (unique, indexed)
    type: v.string(),
    stripeAccountId: v.optional(v.string()), // set for Connect events
    processedAt: v.number(),
  }).index("by_event_id", ["stripeEventId"]),

  // CancelKit's own subscription (platform Stripe account).
  billing: defineTable({
    accountId: v.id("accounts"),
    stripeCustomerId: v.string(), // cus_... on the PLATFORM account
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("none"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("paused"),
      v.literal("canceled")
    ),
    priceId: v.string(), // founder-rate price id
    updatedAt: v.number(),
  }).index("by_account", ["accountId"]),

  // Pre-OAuth outreach demos (FR-003): mocked sandbox pages at /demo/[slug].
  demos: defineTable({
    slug: v.string(),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    plans: v.array(
      v.object({
        nickname: v.string(),
        amountCents: v.number(),
        currency: v.string(),
        interval: v.string(),
      })
    ),
    coupons: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        percentOff: v.optional(v.number()),
        amountOffCents: v.optional(v.number()),
        duration: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Rate limiting for /widget/* (token bucket per account).
  rateLimits: defineTable({
    key: v.string(), // `${accountId}` or `${accountId}:${ip}`
    tokens: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
