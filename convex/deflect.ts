import { v } from "convex/values";
import Stripe from "stripe";
import { internalAction } from "./_generated/server";
import { stripeClient } from "./lib/stripeClient";

// The three deflection actions (FR-006/007/008). Billing state is sacred:
// Stripe idempotency key = sessionId, one retry on 5xx with the SAME key,
// and success is only reported after a read-back verifies the exact state.

class StateConflict extends Error {
  constructor(public conflict: string) {
    super(conflict);
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && (err.statusCode ?? 0) >= 500) {
      return fn(); // same idempotency key — safe to replay
    }
    throw err;
  }
}

function mapStripeError(err: unknown): { code: string; message: string } {
  if (err instanceof StateConflict) {
    return { code: err.conflict, message: err.message };
  }
  if (err instanceof Stripe.errors.StripeError) {
    if (err.code === "resource_missing") {
      return {
        code: "already_canceled",
        message: "This subscription is already canceled.",
      };
    }
    if (err.code === "coupon_expired") {
      return { code: "expired_coupon", message: err.message };
    }
    return { code: "stripe_error", message: err.message };
  }
  return { code: "stripe_error", message: "Stripe isn't responding — nothing has changed on your subscription. Try again." };
}

export const pauseSubscription = internalAction({
  args: {
    stripeAccountId: v.string(),
    subscriptionId: v.string(),
    sessionId: v.string(),
    days: v.number(),
  },
  handler: async (_ctx, args) => {
    const stripe = stripeClient();
    const acct =
      args.stripeAccountId === "self"
        ? {}
        : { stripeAccount: args.stripeAccountId };
    const opts = { ...acct, idempotencyKey: `${args.sessionId}:pause` };
    const resumesAt = Math.floor(Date.now() / 1000) + args.days * 86400;
    try {
      const current = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        {},
        acct
      );
      if (current.status === "canceled") {
        throw new StateConflict("already_canceled");
      }
      if (current.pause_collection) {
        throw new StateConflict("already_paused");
      }
      await withRetry(() =>
        stripe.subscriptions.update(
          args.subscriptionId,
          { pause_collection: { behavior: "void", resumes_at: resumesAt } },
          opts
        )
      );
      // Read back and verify — paused status stays "active"; check the field.
      const after = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        {},
        acct
      );
      if (after.pause_collection?.behavior !== "void") {
        return { ok: false as const, ...mapStripeError(null) };
      }
      return {
        ok: true as const,
        resumesAt: new Date(resumesAt * 1000).toISOString(),
      };
    } catch (err) {
      return { ok: false as const, ...mapStripeError(err) };
    }
  },
});

export const applyCoupon = internalAction({
  args: {
    stripeAccountId: v.string(),
    subscriptionId: v.string(),
    sessionId: v.string(),
    couponId: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripe = stripeClient();
    const acct =
      args.stripeAccountId === "self"
        ? {}
        : { stripeAccount: args.stripeAccountId };
    try {
      const coupon = await stripe.coupons.retrieve(args.couponId, {}, acct);
      if (!coupon.valid) {
        throw new StateConflict("expired_coupon");
      }
      const current = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        {},
        acct
      );
      if (current.status === "canceled") {
        throw new StateConflict("already_canceled");
      }
      await withRetry(() =>
        stripe.subscriptions.update(
          args.subscriptionId,
          { discounts: [{ coupon: args.couponId }] },
          { ...acct, idempotencyKey: `${args.sessionId}:coupon` }
        )
      );
      // Read back and verify the discount landed.
      const after = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        { expand: ["discounts"] },
        acct
      );
      const applied = (after.discounts ?? []).some((d) => {
        if (typeof d === "string") return false;
        const c = d.source?.coupon;
        return typeof c === "string" ? c === args.couponId : c?.id === args.couponId;
      });
      if (!applied) {
        return { ok: false as const, ...mapStripeError(null) };
      }
      const amount = after.items.data[0]?.price?.unit_amount ?? 0;
      const newAmountCents = coupon.percent_off
        ? Math.round(amount * (1 - coupon.percent_off / 100))
        : Math.max(0, amount - (coupon.amount_off ?? 0));
      return { ok: true as const, newAmountCents };
    } catch (err) {
      return { ok: false as const, ...mapStripeError(err) };
    }
  },
});

// Default is cancel_at_period_end: the subscriber keeps the time they paid
// for, and there's no refund/chargeback exposure. Founders can opt into
// immediate cancel in settings.
export const cancelSubscription = internalAction({
  args: {
    stripeAccountId: v.string(),
    subscriptionId: v.string(),
    sessionId: v.string(),
    atPeriodEnd: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const stripe = stripeClient();
    const acct =
      args.stripeAccountId === "self"
        ? {}
        : { stripeAccount: args.stripeAccountId };
    const opts = { ...acct, idempotencyKey: `${args.sessionId}:cancel` };
    // set only for a scheduled (future) end — the widget shows "access until"
    const endsAt = (sub: Stripe.Subscription) =>
      sub.status !== "canceled" && sub.cancel_at
        ? new Date(sub.cancel_at * 1000).toISOString()
        : undefined;
    try {
      const current = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        {},
        acct
      );
      // Idempotent success: the end state the subscriber asked for exists.
      if (current.status === "canceled") {
        return { ok: true as const, endsAt: endsAt(current) };
      }
      if (args.atPeriodEnd && current.cancel_at_period_end) {
        return { ok: true as const, endsAt: endsAt(current) };
      }
      await withRetry(() =>
        args.atPeriodEnd
          ? stripe.subscriptions.update(
              args.subscriptionId,
              { cancel_at_period_end: true },
              opts
            )
          : stripe.subscriptions.cancel(
              args.subscriptionId,
              { prorate: false },
              opts
            )
      );
      const after = await stripe.subscriptions.retrieve(
        args.subscriptionId,
        {},
        acct
      );
      const done = args.atPeriodEnd
        ? after.cancel_at_period_end || after.status === "canceled"
        : after.status === "canceled";
      if (!done) {
        return { ok: false as const, ...mapStripeError(null) };
      }
      return { ok: true as const, endsAt: endsAt(after) };
    } catch (err) {
      return { ok: false as const, ...mapStripeError(err) };
    }
  },
});
