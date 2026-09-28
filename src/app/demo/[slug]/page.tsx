"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { use, useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import {
  CancelFlow,
  FlowResolution,
  ResolveResult,
} from "@/components/features/CancelFlow";
import { capture } from "@/lib/posthog";
import { pickBestCoupon, pauseOffer, couponOffer } from "@/lib/offer";

// Pre-OAuth mocked sandbox for outreach links (FR-003). Works logged-out;
// mutates nothing, logs nothing but the PostHog funnel events.
export default function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const demo = useQuery(api.demos.getBySlug, { slug });
  const [flowKey, setFlowKey] = useState(0);

  useEffect(() => {
    if (demo) capture("demo_opened", { slug });
  }, [demo, slug]);

  if (demo === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
      </main>
    );
  }
  if (demo === null) {
    return (
      <main className="mx-auto max-w-[480px] p-16 text-center text-sm text-muted">
        This demo link doesn&apos;t exist (or was retired). See the real thing
        at{" "}
        <Link href="/" className="text-accent hover:underline">
          cancelkit.com
        </Link>
        .
      </main>
    );
  }

  const plan = demo.plans[0];
  const subscription = {
    planNickname: plan.nickname,
    amountCents: plan.amountCents,
    currency: plan.currency,
    interval: plan.interval,
  };
  const bestCoupon = pickBestCoupon(
    demo.coupons.map((c) => ({ ...c, valid: true })),
    plan.amountCents
  );
  const offer = bestCoupon
    ? couponOffer(bestCoupon, plan.amountCents)
    : pauseOffer();

  async function onResolve(r: FlowResolution): Promise<ResolveResult> {
    if (r.resolution === "cancel") return { outcome: "canceled" };
    if (offer.type === "pause")
      return { outcome: "saved_pause", detail: { resumesAt: offer.resumesAt } };
    return {
      outcome: "saved_coupon",
      detail: { newAmountCents: offer.newAmountCents },
    };
  }

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <div className="mb-6 rounded-md border border-border bg-warning-surface px-4 py-3 text-sm text-warning">
        This demo is mocked from public info — connect Stripe to see it live
        with your real plans and coupons.{" "}
        <a
          href="/api/oauth/start"
          onClick={() => capture("oauth_started", { fromDemo: slug })}
          className="font-semibold underline"
        >
          Connect Stripe →
        </a>
      </div>

      <div className="ink-grid rounded-xl p-4 sm:p-12">
        <div className="mx-auto max-w-[480px] animate-rise rounded-xl shadow-[var(--shadow-modal)]">
          <CancelFlow
            key={flowKey}
            branding={{
              businessName: demo.name,
              logoUrl: demo.logoUrl,
              brandColor: demo.brandColor,
            }}
            subscription={subscription}
            offer={offer}
            onResolve={onResolve}
            onDismiss={() => setFlowKey((k) => k + 1)}
            sandbox
          />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        This is what {demo.name}&apos;s cancel button could do — reason, offer,
        resolution, exit data. Ten seconds to see yours:{" "}
        <a href="/api/oauth/start" className="text-accent hover:underline">
          connect Stripe
        </a>
        .
      </p>
    </main>
  );
}
