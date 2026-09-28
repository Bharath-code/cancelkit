import { v } from "convex/values";
import { SignJWT } from "jose";
import { ConvexError } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { stripeClient } from "./lib/stripeClient";
import { subscriptionAmounts } from "./lib/mrr";

export type SubscriptionAndOffer = {
  subscription: {
    id: string;
    planNickname: string;
    amountCents: number; // per billing interval — what the subscriber sees
    mrrCents: number; // monthly-normalized — what stats and emails sum
    currency: string;
    interval: string;
  };
  offer:
    | { type: "pause"; days: number; resumesAt: string }
    | {
        type: "coupon";
        couponId: string;
        label: string;
        newAmountCents: number;
      };
  multiSubscription: boolean;
} | null;

// Active subscription + computed offer for /widget/session.
export const fetchSubscriptionAndOffer = internalAction({
  args: {
    stripeAccountId: v.string(),
    customerId: v.string(),
    pauseDays: v.number(),
    couponId: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<SubscriptionAndOffer> => {
    const stripe = stripeClient();
    // "self" = CancelKit's own platform subscription (dogfood) — no header.
    const acct =
      args.stripeAccountId === "self"
        ? {}
        : { stripeAccount: args.stripeAccountId };
    const subs = await stripe.subscriptions.list(
      { customer: args.customerId, status: "active", limit: 10 },
      acct
    );
    if (subs.data.length === 0) return null;
    // Most recent active subscription (PRD § 14 open question #4 default).
    const sub = [...subs.data].sort((a, b) => b.created - a.created)[0];
    const item = sub.items.data[0];
    const { amountCents, mrrCents } = subscriptionAmounts(sub.items.data);
    const subscription = {
      id: sub.id,
      planNickname:
        item?.price?.nickname ||
        (typeof item?.price?.product === "object" &&
        item.price.product &&
        "name" in item.price.product
          ? (item.price.product.name as string)
          : "your plan"),
      amountCents,
      mrrCents,
      currency: sub.currency,
      interval: item?.price?.recurring?.interval ?? "month",
    };

    // Founder-configured coupon wins when valid; otherwise pause. If the
    // subscription is already paused, only a coupon offer makes sense.
    let offer: NonNullable<SubscriptionAndOffer>["offer"] | null = null;
    if (args.couponId) {
      try {
        const coupon = await stripe.coupons.retrieve(args.couponId, {}, acct);
        if (coupon.valid) {
          const newAmountCents = coupon.percent_off
            ? Math.round(amountCents * (1 - coupon.percent_off / 100))
            : Math.max(0, amountCents - (coupon.amount_off ?? 0));
          offer = {
            type: "coupon",
            couponId: coupon.id,
            label: coupon.percent_off
              ? `${coupon.percent_off}% off, applied now`
              : `${coupon.name || coupon.id} — discount applied now`,
            newAmountCents,
          };
        }
      } catch {
        offer = null; // fall through to pause
      }
    }
    if (!offer) {
      offer = {
        type: "pause",
        days: args.pauseDays,
        resumesAt: new Date(
          Date.now() + args.pauseDays * 86400_000
        ).toISOString(),
      };
    }
    return {
      subscription,
      offer,
      multiSubscription: subs.data.length > 1,
    };
  },
});

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

// OAuth code exchange — called by /api/oauth/callback.
export const completeOAuth = action({
  args: { code: v.string() },
  handler: async (
    ctx,
    { code }
  ): Promise<{ accountId: string; sessionToken: string }> => {
    const stripe = stripeClient();
    const token = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });
    const stripeAccountId = token.stripe_user_id;
    if (!stripeAccountId) {
      throw new ConvexError({ code: "stripe_error" });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);
    const settings = account.settings;
    let logoUrl: string | undefined;
    const logo = settings?.branding?.logo;
    if (typeof logo === "string") {
      // Resolve the branding file id to a public URL via a file link.
      try {
        const link = await stripe.fileLinks.create(
          { file: logo },
          { stripeAccount: stripeAccountId }
        );
        logoUrl = link.url ?? undefined;
      } catch {
        logoUrl = undefined; // branding is optional — never block OAuth on it
      }
    }

    const accountId = await ctx.runMutation(internal.accounts.upsertFromOAuth, {
      stripeAccountId,
      businessName:
        settings?.dashboard?.display_name ||
        account.business_profile?.name ||
        "Your business",
      logoUrl,
      brandColor: settings?.branding?.primary_color ?? undefined,
      email: account.email ?? undefined,
      newPublicKey: `ck_pub_${randomHex(12)}`,
      newWidgetSecret: randomHex(32),
    });

    const secret = process.env.SESSION_JWT_SECRET;
    if (!secret) throw new ConvexError({ code: "misconfigured" });
    const sessionToken = await new SignJWT({ accountId, stripeAccountId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));

    return { accountId, sessionToken };
  },
});

export type PreviewData = {
  businessName: string;
  logoUrl?: string;
  brandColor?: string;
  plans: {
    id: string;
    nickname: string;
    amountCents: number;
    currency: string;
    interval: string;
  }[];
  coupons: {
    id: string;
    name: string;
    percentOff?: number;
    amountOffCents?: number;
    duration: string;
    valid: boolean;
  }[];
};

// Live data for the sandbox preview and settings pickers.
export const previewData = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }): Promise<PreviewData> => {
    const account = await ctx.runQuery(internal.accounts.getForSession, {
      sessionToken,
    });
    const stripe = stripeClient();
    const opts = { stripeAccount: account.stripeAccountId };

    const [prices, coupons] = await Promise.all([
      stripe.prices.list(
        { active: true, limit: 20, expand: ["data.product"] },
        opts
      ),
      stripe.coupons.list({ limit: 20 }, opts),
    ]);

    const plans = prices.data
      .filter((p) => p.recurring && p.unit_amount != null)
      .map((p) => {
        const product = p.product as { name?: string; active?: boolean };
        return {
          id: p.id,
          nickname: p.nickname || product?.name || p.id,
          amountCents: p.unit_amount!,
          currency: p.currency,
          interval: p.recurring!.interval,
          active: product?.active !== false,
        };
      })
      .filter((p) => p.active)
      .map(({ active: _a, ...plan }) => plan);

    return {
      businessName: account.businessName,
      logoUrl: account.logoUrl,
      brandColor: account.brandColor,
      plans,
      coupons: coupons.data.map((c) => ({
        id: c.id,
        name: c.name || c.id,
        percentOff: c.percent_off ?? undefined,
        amountOffCents: c.amount_off ?? undefined,
        duration: c.duration,
        valid: c.valid,
      })),
    };
  },
});
