"use client";

import { useState } from "react";
import { CancelFlow, FlowResolution, ResolveResult } from "./CancelFlow";

const BRANDS = [
  { businessName: "Tidewater Analytics", brandColor: "#0F766E" },
  { businessName: "Pollen Studio", brandColor: "#7C3AED" },
  { businessName: "Lumen Notes", brandColor: "#0F1E36" },
];

const resumesAt = () => new Date(Date.now() + 30 * 864e5).toISOString();

// A self-contained flow with fake data: nothing is sent anywhere.
export function LandingDemo() {
  const [brand, setBrand] = useState(0);
  const [offerType, setOfferType] = useState<"pause" | "coupon">("pause");
  const [run, setRun] = useState(0);

  async function onResolve(r: FlowResolution): Promise<ResolveResult> {
    await new Promise((res) => setTimeout(res, 700));
    if (r.resolution === "cancel") return { outcome: "canceled" };
    return offerType === "pause"
      ? { outcome: "saved_pause", detail: { resumesAt: resumesAt() } }
      : { outcome: "saved_coupon", detail: { newAmountCents: 2900 } };
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      on ? "border-ink bg-ink text-white" : "border-border bg-surface text-muted hover:text-on-surface"
    }`;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="lg:sticky lg:top-8">
        <h2 className="text-[clamp(30px,4vw,44px)] font-bold leading-[1.05]">
          What your subscriber sees.
        </h2>
        <p className="mt-4 max-w-[46ch] text-muted">
          This is the real component, with pretend data. Click through it.
          In your product it opens in an isolated frame, wears your logo and
          color, and pulls the plan and price from Stripe.
        </p>

        <fieldset className="mt-8">
          <legend className="text-sm font-semibold">Brand</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRANDS.map((b, i) => (
              <button
                key={b.businessName}
                aria-pressed={brand === i}
                onClick={() => { setBrand(i); setRun((n) => n + 1); }}
                className={`${chip(brand === i)} inline-flex items-center gap-2`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: b.brandColor }} />
                {b.businessName}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Offer</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button aria-pressed={offerType === "pause"} className={chip(offerType === "pause")} onClick={() => { setOfferType("pause"); setRun((n) => n + 1); }}>
              30-day pause
            </button>
            <button aria-pressed={offerType === "coupon"} className={chip(offerType === "coupon")} onClick={() => { setOfferType("coupon"); setRun((n) => n + 1); }}>
              50% off, 3 months
            </button>
          </div>
        </fieldset>
      </div>

      {/* browser frame */}
      <div className="rounded-[22px] bg-[#DCE3EC] p-2 shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
          <span className="ml-3 h-5 flex-1 rounded-full bg-white/70 px-3 text-[11px] leading-5 text-muted">
            app.{BRANDS[brand].businessName.toLowerCase().replace(/\s+/g, "")}.com/settings/billing
          </span>
        </div>
        <div className="grid min-h-[520px] place-items-center rounded-[16px] bg-ink/55 p-3 sm:p-8">
          <div className="w-full max-w-[440px] shadow-[var(--shadow-modal)] rounded-xl">
            <CancelFlow
              key={`${brand}-${offerType}-${run}`}
              branding={BRANDS[brand]}
              subscription={{ planNickname: "Pro", amountCents: 5800, currency: "usd", interval: "month" }}
              offer={
                offerType === "pause"
                  ? { type: "pause", days: 30, resumesAt: resumesAt() }
                  : { type: "coupon", couponId: "demo", label: "50% off for the next 3 months", newAmountCents: 2900 }
              }
              onResolve={onResolve}
              onDismiss={() => setRun((n) => n + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
