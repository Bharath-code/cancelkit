"use client";

import { useState } from "react";
import {
  CancelFlow,
  FlowOffer,
  FlowResolution,
  ResolveResult,
} from "@/components/features/CancelFlow";

const branding = { businessName: "Acme Analytics", brandColor: "#4353FF" };
const subscription = {
  planNickname: "Pro",
  amountCents: 7900,
  currency: "usd",
  interval: "month",
};

const pauseOffer: FlowOffer = {
  type: "pause",
  days: 30,
  resumesAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
};
const couponOffer: FlowOffer = {
  type: "coupon",
  couponId: "SAVE20",
  label: "20% off, applied now",
  newAmountCents: 6320,
};

// Dev scratch page: walks all three steps with both offer types, no backend.
export default function FlowScratchPage() {
  const [offerType, setOfferType] = useState<"pause" | "coupon">("pause");
  const [key, setKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  async function onResolve(r: FlowResolution): Promise<ResolveResult> {
    setLog((l) => [...l, JSON.stringify(r)]);
    if (r.resolution === "cancel") return { outcome: "canceled" };
    if (offerType === "pause")
      return {
        outcome: "saved_pause",
        detail: { resumesAt: pauseOffer.type === "pause" ? pauseOffer.resumesAt : "" },
      };
    return { outcome: "saved_coupon", detail: { newAmountCents: 6320 } };
  }

  return (
    <main className="mx-auto max-w-[1080px] space-y-6 p-8">
      <div className="flex gap-3">
        {(["pause", "coupon"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setOfferType(t);
              setKey((k) => k + 1);
            }}
            className={`rounded-md border px-4 py-2 text-sm ${
              offerType === t ? "border-accent" : "border-border"
            }`}
          >
            {t} offer
          </button>
        ))}
        <button
          onClick={() => setKey((k) => k + 1)}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Reset
        </button>
      </div>

      <div className="border border-border p-8" style={{ width: 340 }}>
        <CancelFlow
          key={key}
          branding={branding}
          subscription={subscription}
          offer={offerType === "pause" ? pauseOffer : couponOffer}
          onResolve={onResolve}
          onDismiss={() => setLog((l) => [...l, "dismissed"])}
          sandbox
        />
      </div>

      <pre className="text-xs text-muted">{log.join("\n")}</pre>
    </main>
  );
}
