"use client";

import { useEffect, useRef, useState } from "react";
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
  detail?: { resumesAt?: string; newAmountCents?: number; endsAt?: string };
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

const STEPS = ["reason", "offer", "resolution"] as const;

function StepDots({ step, color }: { step: (typeof STEPS)[number]; color: string }) {
  const at = STEPS.indexOf(step);
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {STEPS.map((s, i) => (
        <span
          key={s}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === at ? 20 : 6,
            background: i <= at ? color : "#D8DFE8",
          }}
        />
      ))}
    </div>
  );
}

function PauseIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill={color} opacity="0.12" />
      <rect x="11" y="10" width="3.5" height="12" rx="1.5" fill={color} />
      <rect x="17.5" y="10" width="3.5" height="12" rx="1.5" fill={color} />
    </svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="15" fill={color} opacity="0.12" />
      <path d="M9 9h7l7 7-7 7-7-7z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="13" cy="13" r="1.6" fill={color} />
    </svg>
  );
}

// Outcome marks draw themselves once — motion that confirms what changed.
function OutcomeMark({ kind }: { kind: "saved" | "canceled" | "error" }) {
  const color = kind === "saved" ? "#0B9A6D" : kind === "error" ? "#C2372B" : "#7C8A9E";
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14" aria-hidden="true" fill="none">
      <circle cx="28" cy="28" r="26" fill={color} opacity="0.1" />
      <circle
        cx="28" cy="28" r="22" stroke={color} strokeWidth="2.5"
        strokeDasharray="140" className="animate-draw" style={{ ["--len" as string]: 140 }}
        transform="rotate(-90 28 28)"
      />
      {kind === "saved" && (
        <path d="M18 29l7 7 13-15" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="36" className="animate-draw" style={{ ["--len" as string]: 36, animationDelay: "0.45s" }} />
      )}
      {kind === "canceled" && (
        <path d="M19 28h18M31 22l6 6-6 6" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="36" className="animate-draw" style={{ ["--len" as string]: 36, animationDelay: "0.45s" }} />
      )}
      {kind === "error" && (
        <path d="M28 18v12M28 37v.5" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray="24" className="animate-draw" style={{ ["--len" as string]: 24, animationDelay: "0.45s" }} />
      )}
    </svg>
  );
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
  const [busy, setBusy] = useState<"accept_offer" | "cancel" | null>(null);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef(step);

  // on step change, move focus to the new heading so keyboard + screen reader
  // users land on the new content; never on mount, so host pages don't jump
  useEffect(() => {
    if (prevStep.current !== step) headingRef.current?.focus({ preventScroll: true });
    prevStep.current = step;
  }, [step]);

  const brandColor = branding.brandColor || "#0F1E36";
  const brandText = textOn(brandColor);
  const brandBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-[opacity,transform,filter] duration-150 hover:brightness-110 active:translate-y-px disabled:opacity-40";

  async function resolve(resolution: "accept_offer" | "cancel") {
    if (busy) return;
    setBusy(resolution);
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
      setBusy(null);
    }
  }

  const spinner = (
    <svg viewBox="0 0 16 16" className="h-4 w-4 animate-spin" aria-hidden="true" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const cancelAnyway = (
    <button
      onClick={() => resolve("cancel")}
      disabled={busy !== null}
      className="inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm text-muted underline-offset-4 transition-colors hover:text-on-surface hover:underline disabled:opacity-50"
    >
      {busy === "cancel" && spinner}
      Cancel my subscription anyway
    </button>
  );

  const headingClass = "text-xl font-semibold leading-snug outline-none";

  return (
    <div className="relative min-w-[280px] max-w-[480px] overflow-hidden rounded-xl bg-surface p-7 text-on-surface sm:p-8">
      {sandbox && (
        <div className="mb-5 flex items-center gap-2 rounded-full bg-marigold-soft px-3 py-1.5 text-xs font-medium text-warning">
          <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
          Sandbox — nothing here touches live billing
        </div>
      )}

      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md text-sm font-bold"
              style={{ background: brandColor, color: brandText }}
            >
              {branding.businessName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="text-sm font-semibold">{branding.businessName}</span>
        </div>
        <StepDots step={step} color={brandColor} />
      </header>

      <div aria-live="polite" className="sr-only">
        {step === "offer" && notice}
        {step === "resolution" && result?.error}
      </div>

      {step === "reason" && (
        <div key="reason" className="animate-step">
          <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
            Before you go — what&apos;s not working?
          </h2>
          <p className="mt-1 text-sm text-muted">
            One question, then you decide. Your answer goes straight to the team.
          </p>
          <div className="mt-5">
            <RadioGroup
              name="reason"
              label="Reason for canceling"
              options={[...REASONS]}
              value={reason}
              onChange={setReason}
              accent={brandColor}
            />
          </div>
          {reason === "other" && (
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Tell us more (optional)"
              aria-label="Tell us more (optional)"
              rows={2}
              className="mt-3 w-full animate-rise rounded-md border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            {cancelAnyway}
            <div className="flex gap-1">
              <button
                onClick={onDismiss}
                className="h-11 rounded-full px-4 text-sm text-muted transition-colors hover:bg-mist hover:text-on-surface"
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
        <div key="offer" className="animate-step">
          <h2 ref={headingRef} tabIndex={-1} className={headingClass}>
            One option before you go
          </h2>
          {notice && (
            <p className="mt-3 rounded-md bg-warning-surface px-3 py-2 text-xs text-warning">
              {notice}
            </p>
          )}
          <div className="mt-5">
            {offer.type === "pause" ? (
              <OfferCard
                accent={brandColor}
                icon={<PauseIcon color={brandColor} />}
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
                accent={brandColor}
                icon={<TagIcon color={brandColor} />}
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
              disabled={busy !== null}
              className={brandBtn}
              style={{ backgroundColor: brandColor, color: brandText }}
            >
              {busy === "accept_offer" && spinner}
              {busy === "accept_offer"
                ? "Working…"
                : offer.type === "pause"
                  ? `Pause for ${offer.days} days`
                  : "Apply the discount"}
            </button>
          </div>
        </div>
      )}

      {step === "resolution" && result && (
        <div key="resolution" className="animate-step text-center">
          {result.error ? (
            <>
              <div className="flex justify-center"><OutcomeMark kind="error" /></div>
              <h2 ref={headingRef} tabIndex={-1} className={`${headingClass} mt-4`}>
                That didn&apos;t work
              </h2>
              <p className="mt-2 text-sm text-error">{result.error}</p>
              <div className="mt-6 flex justify-center">{cancelAnyway}</div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <OutcomeMark kind={result.outcome === "canceled" || result.outcome === "abandoned" ? "canceled" : "saved"} />
              </div>
              <h2 ref={headingRef} tabIndex={-1} className={`${headingClass} mt-4`}>
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
                  (result.detail?.endsAt
                    ? `Canceled. You keep access until ${formatDate(result.detail.endsAt)}, and you won't be charged again.`
                    : "Your subscription is canceled. Thanks for giving us a try.")}
                {result.outcome === "abandoned" && "No changes made."}
              </h2>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={onDismiss}
                  className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
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
