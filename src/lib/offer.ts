import { DEFAULT_PAUSE_DAYS } from "./constants";
import type { FlowOffer } from "@/components/features/CancelFlow";

export type CouponInfo = {
  id: string;
  name: string;
  percentOff?: number;
  amountOffCents?: number;
  duration: string;
  valid: boolean;
};

export function couponSavings(c: CouponInfo, amountCents: number): number {
  if (c.percentOff) return Math.round((amountCents * c.percentOff) / 100);
  if (c.amountOffCents) return Math.min(c.amountOffCents, amountCents);
  return 0;
}

// Best valid repeating/forever coupon by savings; null if none qualify.
export function pickBestCoupon(
  coupons: CouponInfo[],
  amountCents: number
): CouponInfo | null {
  const eligible = coupons.filter(
    (c) => c.valid && (c.duration === "repeating" || c.duration === "forever")
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, c) =>
    couponSavings(c, amountCents) > couponSavings(best, amountCents) ? c : best
  );
}

export function pauseOffer(days = DEFAULT_PAUSE_DAYS): FlowOffer {
  return {
    type: "pause",
    days,
    resumesAt: new Date(Date.now() + days * 86400_000).toISOString(),
  };
}

export function couponOffer(c: CouponInfo, amountCents: number): FlowOffer {
  return {
    type: "coupon",
    couponId: c.id,
    label: c.percentOff
      ? `${c.percentOff}% off, applied now`
      : `${c.name} — discount applied now`,
    newAmountCents: amountCents - couponSavings(c, amountCents),
  };
}
