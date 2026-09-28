"use client";

import { useAction, useMutation } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { PreviewData } from "../../../convex/stripe";
import { capture } from "@/lib/posthog";
import { pickBestCoupon, pauseOffer, couponOffer } from "@/lib/offer";
import { CancelFlow, FlowResolution, ResolveResult } from "./CancelFlow";
import { Card } from "@/components/ui/card";
import { useSessionToken } from "./SessionContext";

const FETCH_TIMEOUT_MS = 10_000;

export function PreviewFrame() {
  const sessionToken = useSessionToken();
  const previewData = useAction(api.stripe.previewData);
  const startSession = useMutation(api.cancelSessions.start);
  const patchSession = useMutation(api.cancelSessions.patch);

  const [data, setData] = useState<PreviewData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [flowKey, setFlowKey] = useState(0);
  const sessionIdRef = useRef<Id<"cancelSessions"> | null>(null);

  // Never sets "loading" itself — callers do (initial state / retry handler).
  const load = useCallback(async () => {
    try {
      const result = await Promise.race([
        previewData({ sessionToken }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS)
        ),
      ]);
      setData(result);
      setState("ready");
      capture("preview_rendered", { ms: Math.round(performance.now()) });
    } catch {
      setState("error");
      capture("preview_render_failed");
    }
  }, [previewData, sessionToken]);

  useEffect(() => {
    // fresh arrival from the OAuth callback → complete the funnel step once
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") {
      capture("oauth_completed");
      window.history.replaceState(null, "", "/preview");
    }
    // setState only fires after the fetch settles, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="ink-grid flex min-h-[460px] flex-col items-center justify-center gap-4 rounded-xl text-[#C9D3E1]">
          <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true" fill="none">
            <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
            <path d="M24 6a18 18 0 0 1 18 18" stroke="#FFB400" strokeWidth="4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.9s" repeatCount="indefinite" />
            </path>
          </svg>
          <p className="text-sm" role="status">Fetching your plans and coupons from Stripe…</p>
        </div>
        <div />
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <Card className="max-w-[480px]">
        <h2 className="text-lg font-semibold">Stripe took too long</h2>
        <p className="mt-2 text-sm text-muted">
          The live fetch didn&apos;t complete in 10 seconds. Nothing is wrong
          with your account — retry usually fixes it.
        </p>
        <button
          onClick={() => {
            setState("loading");
            void load();
          }}
          className="mt-4 rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Retry
        </button>
      </Card>
    );
  }

  const plan = data.plans[0] ?? null;

  if (!plan) {
    return (
      <Card className="max-w-[480px]">
        <h2 className="text-lg font-semibold">No active plans found</h2>
        <p className="mt-2 text-sm text-muted">
          Is this the right Stripe account? The preview builds itself from your
          active recurring prices, and this account has none.
        </p>
        <a
          href="/api/oauth/start"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Reconnect Stripe
        </a>
      </Card>
    );
  }

  const subscription = {
    planNickname: plan.nickname,
    amountCents: plan.amountCents,
    currency: plan.currency,
    interval: plan.interval,
  };
  const bestCoupon = pickBestCoupon(data.coupons, plan.amountCents);
  const offer = bestCoupon
    ? couponOffer(bestCoupon, plan.amountCents)
    : pauseOffer();

  async function onResolve(r: FlowResolution): Promise<ResolveResult> {
    // Sandbox: log the session, mutate nothing in Stripe.
    if (!sessionIdRef.current) {
      sessionIdRef.current = await startSession({
        sessionToken,
        stripeCustomerId: "cus_sandbox",
        stripeSubscriptionId: "sub_sandbox",
        mrrCents: plan!.amountCents,
        currency: plan!.currency,
        planNickname: plan!.nickname,
      });
    }
    const outcome =
      r.resolution === "cancel"
        ? ("canceled" as const)
        : offer.type === "pause"
          ? ("saved_pause" as const)
          : ("saved_coupon" as const);
    await patchSession({
      sessionToken,
      id: sessionIdRef.current,
      reason: r.reason ?? undefined,
      reasonText: r.reasonText,
      offerType: offer.type,
      offerDetail:
        offer.type === "pause" ? `pause_${offer.days}d` : offer.couponId,
      outcome,
    });
    sessionIdRef.current = null;
    if (outcome === "saved_pause" && offer.type === "pause") {
      return { outcome, detail: { resumesAt: offer.resumesAt } };
    }
    if (outcome === "saved_coupon" && offer.type === "coupon") {
      return { outcome, detail: { newAmountCents: offer.newAmountCents } };
    }
    return { outcome };
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* device-style frame */}
      <div className="ink-grid rounded-xl p-4 sm:p-12">
        <div className="mx-auto max-w-[480px] animate-rise rounded-xl shadow-[var(--shadow-modal)]">
          <CancelFlow
            key={flowKey}
            branding={{
              businessName: data.businessName,
              logoUrl: data.logoUrl,
              brandColor: data.brandColor,
            }}
            subscription={subscription}
            offer={offer}
            onResolve={onResolve}
            onDismiss={() => setFlowKey((k) => k + 1)}
            sandbox
          />
        </div>
      </div>

      {/* right rail */}
      <div className="space-y-4">
        <Card>
          <h2 className="text-lg font-semibold">Built from your Stripe account</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="tnum font-semibold text-on-surface">
                {data.plans.length}
              </span>{" "}
              active plan{data.plans.length === 1 ? "" : "s"} found
            </li>
            <li>
              <span className="tnum font-semibold text-on-surface">
                {data.coupons.length}
              </span>{" "}
              coupon{data.coupons.length === 1 ? "" : "s"} found
            </li>
            <li>
              Offer shown:{" "}
              <span className="font-semibold text-on-surface">
                {offer.type === "pause"
                  ? `${offer.days}-day pause`
                  : offer.label}
              </span>
            </li>
          </ul>
          {data.coupons.length === 0 && (
            <p className="mt-3 rounded-sm bg-warning-surface px-3 py-2 text-xs text-warning">
              No coupons found — the preview shows a pause-only flow. Create a
              coupon in Stripe to preview discount offers.
            </p>
          )}
        </Card>
        <Link
          href="/install"
          className="block rounded-md bg-primary px-5 py-2.5 text-center text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          Install it — one script tag
        </Link>
      </div>
    </div>
  );
}
