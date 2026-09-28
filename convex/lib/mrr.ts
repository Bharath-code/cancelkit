// Per-interval invoice amount and its monthly-normalized MRR.
// All items on one Stripe subscription share a billing interval.

type Item = {
  quantity?: number | null;
  price?: {
    unit_amount?: number | null;
    recurring?: { interval?: string; interval_count?: number } | null;
  } | null;
};

const MONTHS: Record<string, number> = { day: 1 / 30, week: 12 / 52, month: 1, year: 12 };

export function subscriptionAmounts(items: Item[]): {
  amountCents: number;
  mrrCents: number;
} {
  let amountCents = 0;
  let mrr = 0;
  for (const item of items) {
    const line = (item.price?.unit_amount ?? 0) * (item.quantity ?? 1);
    const r = item.price?.recurring;
    const months = (MONTHS[r?.interval ?? "month"] ?? 1) * (r?.interval_count ?? 1);
    amountCents += line;
    mrr += line / months;
  }
  return { amountCents, mrrCents: Math.round(mrr) };
}
