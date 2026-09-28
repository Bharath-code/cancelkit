import { expect, test } from "vitest";
import { subscriptionAmounts } from "../convex/lib/mrr";

const price = (unit_amount: number, interval: string, interval_count = 1) => ({
  unit_amount,
  recurring: { interval, interval_count },
});

test("annual plan normalizes to monthly", () => {
  expect(subscriptionAmounts([{ quantity: 1, price: price(120000, "year") }])).toEqual({
    amountCents: 120000,
    mrrCents: 10000,
  });
});

test("quantity and multiple items sum", () => {
  const r = subscriptionAmounts([
    { quantity: 3, price: price(1000, "month") },
    { quantity: 1, price: price(500, "month") },
  ]);
  expect(r).toEqual({ amountCents: 3500, mrrCents: 3500 });
});

test("quarterly interval_count divides by 3", () => {
  expect(subscriptionAmounts([{ quantity: 1, price: price(9000, "month", 3) }]).mrrCents).toBe(3000);
});

test("missing amounts don't throw", () => {
  expect(subscriptionAmounts([{ price: null }])).toEqual({ amountCents: 0, mrrCents: 0 });
});
