"use client";

import { useId, useState } from "react";

const PRICE = 24;
// Vendor-reported benchmark: cancel flows save 15–30% of deliberate cancels.
const LOW = 0.15;
const HIGH = 0.3;

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function SaveCalculator() {
  const [cancels, setCancels] = useState(20);
  const [plan, setPlan] = useState(49);
  const ids = [useId(), useId()];
  const low = cancels * LOW * plan;
  const high = cancels * HIGH * plan;
  const pct = Math.min(100, (PRICE / Math.max(high, 1)) * 100);

  const slider =
    "mt-3 w-full cursor-pointer accent-[#0F1E36]";

  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8">
      <h3 className="text-xl font-semibold">Is it worth it for you?</h3>
      <div className="mt-6 space-y-6">
        <label htmlFor={ids[0]} className="block">
          <span className="flex justify-between text-sm">
            <span>Cancellations per month</span>
            <span className="tnum font-semibold">{cancels}</span>
          </span>
          <input id={ids[0]} type="range" min={1} max={200} value={cancels} onChange={(e) => setCancels(+e.target.value)} className={slider} />
        </label>
        <label htmlFor={ids[1]} className="block">
          <span className="flex justify-between text-sm">
            <span>Average plan price</span>
            <span className="tnum font-semibold">{usd(plan)}/mo</span>
          </span>
          <input id={ids[1]} type="range" min={5} max={500} step={1} value={plan} onChange={(e) => setPlan(+e.target.value)} className={slider} />
        </label>
      </div>

      <div className="mt-8 rounded-md bg-mist p-5" aria-live="polite">
        <div className="text-sm text-muted">MRR you could keep each month</div>
        <div className="tnum font-display mt-1 text-[34px] font-bold leading-tight text-success">
          {usd(low)}–{usd(high)}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-success-surface" aria-hidden="true">
          <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Dark bar: CancelKit&apos;s {usd(PRICE)}/mo against the high estimate.
          Range assumes a 15–30% save rate, the benchmark cancel-flow vendors
          report. Your number will differ.
        </p>
      </div>
    </div>
  );
}
