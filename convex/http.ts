import { httpRouter } from "convex/server";
import type Stripe from "stripe";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyHmac } from "./lib/hmac";
import { captureException } from "./lib/sentry";
import { stripeClient, subtleCryptoProvider } from "./lib/stripeClient";
import { REASON_VALUES } from "./constants";
import type { SubscriptionAndOffer } from "./stripe";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

// The embed page (app origin) calls these endpoints cross-origin in dev
// (app :3000 → convex .site) and same-site in prod.
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": process.env.APP_URL || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

const preflight = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

for (const path of [
  "/widget/session",
  "/widget/resolve",
  "/widget/heartbeat",
  "/widget/error",
]) {
  http.route({ path, method: "OPTIONS", handler: preflight });
}

// ---------------------------------------------------------------- heartbeat

http.route({
  path: "/widget/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => null);
    const publicKey = typeof body?.publicKey === "string" ? body.publicKey : "";
    if (!publicKey) return json(400, { error: "publicKey required", code: "not_found" });
    const ok = await ctx.runMutation(internal.widget.takeRate, {
      key: `${publicKey}:hb`,
    });
    if (!ok) return json(429, { error: "rate limited", code: "rate_limited" });
    await ctx.runMutation(internal.widget.recordHeartbeat, { publicKey });
    return json(200, {});
  }),
});

// ------------------------------------------------------------- error beacon

http.route({
  path: "/widget/error",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => null);
    const publicKey = typeof body?.publicKey === "string" ? body.publicKey : "";
    if (!publicKey) return json(400, { error: "publicKey required", code: "not_found" });
    // hard limit: 5/min/account
    const ok = await ctx.runMutation(internal.widget.takeRate, {
      key: `${publicKey}:err`,
      capacity: 5,
      refillPerMinute: 5,
    });
    if (!ok) return json(429, { error: "rate limited", code: "rate_limited" });
    await captureException(
      new Error(String(body?.message ?? "widget error")),
      { publicKey, stack: String(body?.stack ?? "") },
      process.env.SENTRY_DSN_WIDGET
    );
    return json(200, {});
  }),
});

// ---------------------------------------------------------- /widget/session

http.route({
  path: "/widget/session",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => null);
    const publicKey = typeof body?.publicKey === "string" ? body.publicKey : "";
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";
    const hmac = typeof body?.hmac === "string" ? body.hmac : "";
    const sandbox = body?.sandbox === true;
    if (!publicKey || !customerId) {
      return json(404, { error: "unknown account or customer", code: "not_found" });
    }
    if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) {
      return json(404, { error: "malformed customer id", code: "not_found" });
    }

    const account = await ctx.runQuery(internal.widget.getAccountByPublicKey, {
      publicKey,
    });
    if (!account) {
      return json(404, { error: "unknown account", code: "not_found" });
    }

    const allowed = await ctx.runMutation(internal.widget.takeRate, {
      key: account._id,
    });
    if (!allowed) {
      return json(429, { error: "rate limited", code: "rate_limited" });
    }

    // Kill switch / revoked access.
    if (account.widgetStatus === "killed" || account.widgetStatus === "revoked") {
      return json(403, { error: "widget disabled", code: "disabled", disabled: true });
    }

    // Billing gate (FR: serve while active, or past_due within 14-day grace).
    // Sandbox/preview sessions are always allowed; the reserved self-account
    // (CancelKit's own dogfooded cancel) is exempt.
    if (!sandbox && account.stripeAccountId !== "self") {
      const billing = await ctx.runQuery(internal.billing.getByAccount, {
        accountId: account._id,
      });
      const GRACE_MS = 14 * 24 * 60 * 60 * 1000;
      const serves =
        billing !== null &&
        (billing.status === "active" ||
          (billing.status === "past_due" &&
            Date.now() - billing.updatedAt < GRACE_MS));
      if (!serves) {
        return json(403, { error: "subscription required", code: "disabled", disabled: true });
      }
    }

    // HMAC verification (skipped for sandbox sessions, which never mutate).
    if (!sandbox) {
      const valid =
        hmac.length > 0 &&
        (await verifyHmac(customerId, hmac, account.widgetSecret));
      if (!valid) {
        return json(401, { error: "invalid hmac", code: "invalid_hmac" });
      }
    }

    let data: SubscriptionAndOffer;
    try {
      data = await ctx.runAction(internal.stripe.fetchSubscriptionAndOffer, {
        stripeAccountId: account.stripeAccountId,
        customerId,
        pauseDays: account.offerConfig.pauseDays,
        couponId: account.offerConfig.couponId,
      });
    } catch (err) {
      await captureException(err, { publicKey });
      return json(502, { error: "stripe unavailable", code: "stripe_error" });
    }
    if (!data) {
      return json(404, { error: "no active subscription", code: "not_found" });
    }

    const sessionId = await ctx.runMutation(internal.widget.createSession, {
      accountId: account._id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: data.subscription.id,
      mrrCents: data.subscription.amountCents,
      currency: data.subscription.currency,
      planNickname: data.subscription.planNickname,
      offerType: data.offer.type,
      offerDetail:
        data.offer.type === "pause"
          ? `pause_${data.offer.days}d`
          : data.offer.couponId,
      sandbox,
      multiSubscription: data.multiSubscription || undefined,
    });

    return json(200, {
      sessionId,
      reasons: REASON_VALUES,
      offer: data.offer,
      subscription: {
        planNickname: data.subscription.planNickname,
        amountCents: data.subscription.amountCents,
        currency: data.subscription.currency,
        interval: data.subscription.interval,
      },
      branding: {
        businessName: account.businessName,
        logoUrl: account.logoUrl,
        brandColor: account.brandColor,
      },
    });
  }),
});

// ---------------------------------------------------------- /widget/resolve

http.route({
  path: "/widget/resolve",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json().catch(() => null);
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const resolution = body?.resolution as string;
    const reason = typeof body?.reason === "string" ? body.reason : undefined;
    const reasonText =
      typeof body?.reasonText === "string"
        ? body.reasonText.slice(0, 2000)
        : undefined;
    if (!sessionId || !["accept_offer", "cancel", "dismiss"].includes(resolution)) {
      return json(400, { error: "bad request", code: "not_found" });
    }
    if (reason && !REASON_VALUES.includes(reason as never)) {
      return json(400, { error: "unknown reason", code: "not_found" });
    }

    let found;
    try {
      found = await ctx.runQuery(internal.widget.getSession, {
        id: sessionId as Id<"cancelSessions">,
      });
    } catch {
      return json(404, { error: "unknown session", code: "not_found" });
    }
    if (!found) return json(404, { error: "unknown session", code: "not_found" });
    const { session, account } = found;

    // Single-use: any already-resolved session is a 409.
    if (session.outcome !== "open") {
      return json(409, { error: "session already resolved", code: "stripe_error" });
    }

    const allowed = await ctx.runMutation(internal.widget.takeRate, {
      key: `${account._id}:resolve`,
    });
    if (!allowed) {
      return json(429, { error: "rate limited", code: "rate_limited" });
    }

    // Dismiss — no Stripe, sandbox or live.
    if (resolution === "dismiss") {
      await ctx.runMutation(internal.widget.patchSession, {
        id: session._id,
        reason,
        reasonText,
        outcome: "abandoned",
      });
      return json(200, { outcome: "abandoned" });
    }

    // Sandbox sessions mutate nothing in Stripe.
    if (session.sandbox) {
      const outcome =
        resolution === "cancel"
          ? ("canceled" as const)
          : session.offerType === "pause"
            ? ("saved_pause" as const)
            : ("saved_coupon" as const);
      await ctx.runMutation(internal.widget.patchSession, {
        id: session._id,
        reason,
        reasonText,
        outcome,
      });
      return json(200, { outcome });
    }

    // Live resolutions.
    if (resolution === "cancel") {
      const result = await ctx.runAction(internal.deflect.cancelSubscription, {
        stripeAccountId: account.stripeAccountId,
        subscriptionId: session.stripeSubscriptionId,
        sessionId: session._id,
      });
      if (!result.ok) {
        if (result.code === "already_canceled") {
          await ctx.runMutation(internal.widget.patchSession, {
            id: session._id,
            reason,
            reasonText,
            outcome: "canceled",
          });
          return json(409, {
            error: "This subscription is already canceled.",
            code: "stripe_error",
          });
        }
        return json(409, { error: result.message, code: "stripe_error" });
      }
      await ctx.runMutation(internal.widget.patchSession, {
        id: session._id,
        reason,
        reasonText,
        outcome: "canceled",
      });
      return json(200, { outcome: "canceled" });
    }

    // accept_offer
    if (session.offerType === "pause") {
      const days =
        parseInt(session.offerDetail?.match(/pause_(\d+)d/)?.[1] ?? "", 10) ||
        account.offerConfig.pauseDays;
      const result = await ctx.runAction(internal.deflect.pauseSubscription, {
        stripeAccountId: account.stripeAccountId,
        subscriptionId: session.stripeSubscriptionId,
        sessionId: session._id,
        days,
      });
      if (!result.ok) {
        await captureException(new Error(`pause failed: ${result.code}`), {
          sessionId: session._id,
        });
        return json(409, {
          error:
            result.code === "already_canceled"
              ? "This subscription is already canceled."
              : result.code === "already_paused"
                ? "This subscription is already paused."
                : result.message,
          code: "stripe_error",
        });
      }
      await ctx.runMutation(internal.widget.patchSession, {
        id: session._id,
        reason,
        reasonText,
        outcome: "saved_pause",
      });
      await ctx.scheduler.runAfter(0, internal.emails.sendSaveEmail, {
        sessionId: session._id,
      });
      return json(200, {
        outcome: "saved_pause",
        detail: { resumesAt: result.resumesAt },
      });
    }

    // coupon offer
    const result = await ctx.runAction(internal.deflect.applyCoupon, {
      stripeAccountId: account.stripeAccountId,
      subscriptionId: session.stripeSubscriptionId,
      sessionId: session._id,
      couponId: session.offerDetail ?? "",
    });
    if (!result.ok) {
      await captureException(new Error(`coupon failed: ${result.code}`), {
        sessionId: session._id,
      });
      if (result.code === "expired_coupon") {
        // § 11: re-offer the pause. Swap the session's offer so a subsequent
        // accept executes the pause, and hand the embed the fallback offer.
        const days = account.offerConfig.pauseDays;
        await ctx.runMutation(internal.widget.patchSession, {
          id: session._id,
          reason,
          reasonText,
          offerType: "pause",
          offerDetail: `pause_${days}d`,
        });
        return json(409, {
          error:
            "That discount expired between opening and accepting — sorry. Your subscription is unchanged.",
          code: "stripe_error",
          conflict: "expired_coupon",
          fallbackOffer: {
            type: "pause",
            days,
            resumesAt: new Date(Date.now() + days * 86400_000).toISOString(),
          },
        });
      }
      return json(409, { error: result.message, code: "stripe_error" });
    }
    await ctx.runMutation(internal.widget.patchSession, {
      id: session._id,
      reason,
      reasonText,
      outcome: "saved_coupon",
    });
    await ctx.scheduler.runAfter(0, internal.emails.sendSaveEmail, {
      sessionId: session._id,
    });
    return json(200, {
      outcome: "saved_coupon",
      detail: { newAmountCents: result.newAmountCents },
    });
  }),
});

// ---------------------------------------------------------- /stripe/webhook

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.text(); // raw body BEFORE any JSON parsing
    const signature = request.headers.get("Stripe-Signature") ?? "";
    const stripe = stripeClient();

    // One endpoint, two signing secrets: try platform, then Connect.
    let event: Stripe.Event | null = null;
    for (const secret of [
      process.env.STRIPE_WEBHOOK_SECRET_PLATFORM,
      process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
    ]) {
      if (!secret) continue;
      try {
        event = await stripe.webhooks.constructEventAsync(
          payload,
          signature,
          secret,
          undefined,
          subtleCryptoProvider
        );
        break;
      } catch {
        // try the next secret
      }
    }
    if (!event) {
      await captureException(new Error("webhook bad signature"));
      return new Response("bad signature", { status: 400 });
    }

    // Idempotency ledger — duplicate delivery short-circuits to 200.
    const fresh = await ctx.runMutation(internal.webhooks.tryInsertEvent, {
      stripeEventId: event.id,
      type: event.type,
      stripeAccountId: event.account ?? undefined,
    });
    if (!fresh) return new Response("duplicate", { status: 200 });

    try {
      if (event.account) {
        // ------- Connect events (founder accounts)
        if (
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          const sub = event.data.object as Stripe.Subscription;
          // Out-of-order safety: fetch current state, never trust order.
          let current: Stripe.Subscription | null = null;
          try {
            current = await stripe.subscriptions.retrieve(
              sub.id,
              {},
              { stripeAccount: event.account }
            );
          } catch {
            current = null; // fully deleted — treat as canceled
          }
          if (!current || current.status === "canceled") {
            await ctx.runMutation(
              internal.webhooks.closeOpenSessionsForSubscription,
              { stripeSubscriptionId: sub.id }
            );
          }
          // pause set/cleared externally: no-op — Stripe stays the truth
        } else if (event.type === "account.application.deauthorized") {
          const accountId = await ctx.runMutation(internal.webhooks.revokeAccount, {
            stripeAccountId: event.account,
          });
          if (accountId) {
            await ctx.scheduler.runAfter(0, internal.emails.sendRevokedEmail, {
              accountId,
            });
          }
        }
        // unknown Connect events: 200 no-op
      } else {
        // ------- Platform events (CancelKit's own billing, TASK-042)
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const accountId = session.client_reference_id;
          const customer =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          if (accountId && customer) {
            await ctx.runMutation(internal.billing.upsertStatus, {
              accountId: accountId as Id<"accounts">,
              stripeCustomerId: customer,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription?.id,
              status: "active",
              priceId: process.env.STRIPE_FOUNDER_PRICE_ID ?? "",
            });
          }
        } else if (
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          const sub = event.data.object as Stripe.Subscription;
          const customer =
            typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          // Out-of-order safety: fetch current state from Stripe.
          let status: "active" | "past_due" | "paused" | "canceled" = "canceled";
          try {
            const current = await stripe.subscriptions.retrieve(sub.id);
            status = current.pause_collection
              ? "paused"
              : current.status === "past_due" || current.status === "unpaid"
                ? "past_due"
                : current.status === "canceled"
                  ? "canceled"
                  : "active";
          } catch {
            status = "canceled"; // gone = canceled
          }
          await ctx.runMutation(internal.billing.patchStatusByCustomer, {
            stripeCustomerId: customer,
            status,
          });
        } else if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object as Stripe.Invoice;
          const customer =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;
          if (customer) {
            const result = await ctx.runMutation(
              internal.billing.patchStatusByCustomer,
              { stripeCustomerId: customer, status: "past_due" }
            );
            // dunning-lite: single email, only on the transition into past_due
            if (result?.statusChanged) {
              await ctx.scheduler.runAfter(0, internal.emails.sendDunningEmail, {
                accountId: result.accountId,
              });
            }
          }
        }
        // unknown platform events: 200 no-op
      }
    } catch (err) {
      // Ledger row exists; Stripe will not retry a 200. Capture loudly.
      await captureException(err, { eventId: event.id, type: event.type });
    }
    return new Response("ok", { status: 200 });
  }),
});

export default http;
