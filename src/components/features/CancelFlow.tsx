"use client";

import { useState } from "react";
import { REASONS } from "@/lib/constants";
import { textOn } from "@/lib/contrast";
import { RadioGroup } from "@/components/ui/radio-group";
import { OfferCard } from "@/components/ui/offer-card";

export type FlowBranding = {
  businessName: string;
  logoUrl?: string;
  brandColor?: string;
};

export type FlowSubscription = {
  planNickname: string;
  amountCents: number;
  currency: string;
  interval: string;
};

export type FlowOffer =
  | { type: "pause"; days: number; resumesAt: string }
  | { type: "coupon"; couponId: string; label: string; newAmountCents: number };

export type FlowResolution = {
  resolution: "accept_offer" | "cancel" | "dismiss";
  reason: string | null;
  reasonText?: string;
};

export type ResolveResult = {
  outcome: "saved_pause" | "saved_coupon" | "canceled" | "abandoned";
  detail?: { resumesAt?: string; newAmountCents?: number };
  error?: string; // mechanism-first message when Stripe rejected the action
  // coupon expired at accept-time: swap to this offer and return to the
  // offer step instead of showing a dead end (PRD § 11)
  retryOffer?: FlowOffer;
};

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// Pure UI, data-agnostic. The parent supplies data and executes resolutions.
export function CancelFlow({
  branding,
  subscription,
  offer: initialOffer,
  onResolve,
  onDismiss,
  sandbox = false,
}: {
  branding: FlowBranding;
  subscription: FlowSubscription;
  offer: FlowOffer;
  onResolve: (r: FlowResolution) => Promise<ResolveResult>;
  onDismiss: () => void;
  sandbox?: boolean;
}) {
  const [step, setStep] = useState<"reason" | "offer" | "resolution">("reason");
  const [offer, setOffer] = useState<FlowOffer>(initialOffer);
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);

  const brandColor = branding.brandColor || "#16181D";
  const brandText = textOn(brandColor);
  const brandBtn =
    "h-10 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4353FF]";

  async function resolve(resolution: "accept_offer" | "cancel") {
    if (busy) return;
    setBusy(true);
    try {
      const r = await onResolve({
        resolution,
        reason,
        reasonText: reason === "other" && reasonText ? reasonText : undefined,
      });
      if (r.retryOffer) {
        // expired coupon → fall back to the pause offer, stay in the flow
        setOffer(r.retryOffer);
        setNotice(r.error ?? "That offer expired — here's another.");
        setStep("offer");
        return;
      }
      setResult(r);
      setStep("resolution");
    } finally {
      setBusy(false);
    }
  }

  const cancelAnyway = (
    <button
      onClick={() => resolve("cancel")}
      disabled={busy}
      className="h-10 rounded-md px-5 py-2.5 text-sm text-muted transition-colors hover:text-on-surface disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4353FF]"
    >
      Cancel my subscription anyway
    </button>
  );

  return (
    <div className="min-w-[280px] max-w-[480px] rounded-lg bg-surface p-8 text-on-surface">
      {sandbox && (
        <div className="mb-4 rounded-sm bg-warning-surface px-3 py-2 text-xs font-medium tracking-wide text-warning">
          Sandbox — nothing here touches live billing
        </div>
      )}

      <header className="mb-6 flex items-center gap-3">
        {branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt=""
            className="h-8 w-8 rounded-sm object-contain"
          />
        )}
        <span className="text-sm font-semibold">{branding.businessName}</span>
      </header>

      {step === "reason" && (
        <div>
          <h2 className="text-lg font-semibold">
            Before you go — what&apos;s not working?
          </h2>
          <div className="mt-4">
            <RadioGroup
              name="reason"
              label="Reason for canceling"
              options={[...REASONS]}
              value={reason}
              onChange={setReason}
            />
          </div>
          {reason === "other" && (
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Tell us more (optional)"
              rows={2}
              className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            {cancelAnyway}
            <div className="flex gap-2">
              <button
                onClick={onDismiss}
                className="h-10 rounded-md px-5 py-2.5 text-sm text-muted hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4353FF]"
              >
                Never mind
              </button>
              <button
                onClick={() => setStep("offer")}
                disabled={!reason}
                className={brandBtn}
                style={{ backgroundColor: brandColor, color: brandText }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "offer" && (
        <div>
          <h2 className="text-lg font-semibold">One option before you go</h2>
          {notice && (
            <p className="mt-2 rounded-sm bg-warning-surface px-3 py-2 text-xs text-warning">
              {notice}
            </p>
          )}
          <div className="mt-4">
            {offer.type === "pause" ? (
              <OfferCard
                title={`Pause for ${offer.days} days instead`}
                terms={`Billing stops today. Nothing is charged until ${formatDate(
                  offer.resumesAt
                )}, then your ${subscription.planNickname} plan (${formatMoney(
                  subscription.amountCents,
                  subscription.currency
                )}/${subscription.interval}) resumes automatically. Cancel any time during the pause.`}
              />
            ) : (
              <OfferCard
                title={offer.label}
                terms={`From your next invoice you pay ${formatMoney(
                  offer.newAmountCents,
                  subscription.currency
                )}/${subscription.interval} instead of ${formatMoney(
                  subscription.amountCents,
                  subscription.currency
                )}/${subscription.interval}, on the same plan.`}
              />
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            {cancelAnyway}
            <button
              onClick={() => resolve("accept_offer")}
              disabled={busy}
              className={brandBtn}
              style={{ backgroundColor: brandColor, color: brandText }}
            >
              {busy
                ? "Working…"
                : offer.type === "pause"
                  ? `Pause for ${offer.days} days`
                  : "Apply the discount"}
            </button>
          </div>
        </div>
      )}

      {step === "resolution" && result && (
        <div>
          {result.error ? (
            <>
              <h2 className="text-lg font-semibold">That didn&apos;t work</h2>
              <p className="mt-3 text-sm text-error">{result.error}</p>
              <div className="mt-6">{cancelAnyway}</div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                {result.outcome === "saved_pause" &&
                  `Paused until ${
                    result.detail?.resumesAt
                      ? formatDate(result.detail.resumesAt)
                      : "your resume date"
                  } — you won't be charged until then.`}
                {result.outcome === "saved_coupon" &&
                  `Done — from your next invoice: ${
                    result.detail?.newAmountCents != null
                      ? formatMoney(
                          result.detail.newAmountCents,
                          subscription.currency
                        )
                      : "your new price"
                  }/${subscription.interval}.`}
                {result.outcome === "canceled" &&
                  "Your subscription is canceled. Sorry to see you go."}
                {result.outcome === "abandoned" && "No changes made."}
              </h2>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onDismiss}
                  className="h-10 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4353FF]"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
