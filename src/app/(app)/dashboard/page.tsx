"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSessionToken } from "@/components/features/SessionContext";
import { Card } from "@/components/ui/card";
import { REASONS } from "@/lib/constants";

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const OUTCOME_LABELS: Record<string, { label: string; dot: string; className: string }> = {
  saved_pause: { label: "Kept, paused", dot: "bg-jade", className: "text-success" },
  saved_coupon: { label: "Kept, discounted", dot: "bg-jade", className: "text-success" },
  canceled: { label: "Left", dot: "bg-slate-exit", className: "text-muted" },
  abandoned: { label: "Closed the flow", dot: "bg-border", className: "text-muted" },
  open: { label: "In progress", dot: "bg-marigold", className: "text-warning" },
};

// Numbers count up once when the dashboard loads.
function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function SaveRing({ rate }: { rate: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const shown = useCountUp(rate);
  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="#34D399" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="tnum font-display text-[32px] font-bold leading-none">{Math.round(shown * 100)}%</div>
          <div className="mt-1 text-xs text-[#AAB6C8]">save rate</div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const live = status === "live";
  const label =
    live ? "Widget live" : status === "killed" ? "Kill switch on" : status === "revoked" ? "Stripe access revoked" : status === "silent" ? "No heartbeat in 24h" : "Widget not installed";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
      <span className="relative flex h-2.5 w-2.5">
        {live && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-jade" />}
        <span className={`relative h-2.5 w-2.5 rounded-full ${live ? "bg-jade" : status === "not_installed" || status === "silent" ? "bg-marigold" : "bg-slate-exit"}`} />
      </span>
      {label}
    </span>
  );
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 240 120" className="h-auto w-[220px]" aria-hidden="true" fill="none">
      <path d="M20 80H220" stroke="#D8DFE8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
      <path d="M120 80C120 30 60 24 44 60" stroke="#D8DFE8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
      <circle cx="120" cy="80" r="16" fill="#FFB400" />
      <circle cx="120" cy="80" r="16" stroke="#FFB400" strokeWidth="2" className="motion-only">
        <animate attributeName="r" values="16;30" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <rect x="114" y="73" width="4" height="14" rx="1.5" fill="#0F1E36" />
      <rect x="122" y="73" width="4" height="14" rx="1.5" fill="#0F1E36" />
    </svg>
  );
}

export default function DashboardPage() {
  const sessionToken = useSessionToken();
  const stats = useQuery(api.cancelSessions.stats, { sessionToken });
  const kept = useCountUp(stats?.savedMrrCents ?? 0);

  if (stats === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-md bg-border/60" />
        <div className="h-[220px] animate-pulse rounded-xl bg-ink/90" />
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  const reasonLabel = (r?: string) =>
    REASONS.find((x) => x.value === r)?.label ?? "No reason given";

  const unfinished = Math.max(0, stats.offersShown - stats.saves - stats.cancels);
  const total = Math.max(1, stats.offersShown);
  const reasonCounts = REASONS.map((r) => ({
    ...r,
    n: stats.recent.filter((s) => s.reason === r.value).length,
  }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxReason = Math.max(1, ...reasonCounts.map((r) => r.n));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold leading-tight">Dashboard</h1>
        <StatusPill status={stats.widgetStatus} />
      </div>

      <section className="ink-grid animate-rise overflow-hidden rounded-xl p-6 text-white sm:p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[#C9D3E1]">MRR kept by CancelKit</p>
            <p className="tnum font-display mt-1 text-[clamp(48px,8vw,76px)] font-extrabold leading-none tracking-[-0.03em] text-[#5FE0B0]">
              {money(Math.round(kept))}
            </p>
            <p className="mt-3 text-sm text-[#AAB6C8]">
              <span className="tnum font-semibold text-white">{stats.saves}</span> kept,{" "}
              <span className="tnum font-semibold text-white">{stats.cancels}</span> left,{" "}
              <span className="tnum font-semibold text-white">{stats.offersShown}</span> saw the flow
            </p>
          </div>
          <SaveRing rate={stats.saveRate} />
        </div>

        {stats.offersShown > 0 && (
          <div className="mt-8">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img"
              aria-label={`${stats.saves} kept, ${stats.cancels} left, ${unfinished} closed the flow or still in progress`}>
              <div className="bg-[#34D399] transition-[width] duration-700" style={{ width: `${(stats.saves / total) * 100}%` }} />
              <div className="bg-slate-exit transition-[width] duration-700" style={{ width: `${(stats.cancels / total) * 100}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#AAB6C8]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#34D399]" />Kept</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-exit" />Left</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" />Closed or in progress</span>
            </div>
          </div>
        )}
      </section>

      {stats.recent.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center">
          <EmptyIllustration />
          {stats.widgetStatus === "live" ? (
            <>
              <h2 className="mt-6 text-xl font-semibold">Listening for the next cancel</h2>
              <p className="mt-2 max-w-[44ch] text-muted">
                The widget is live. This page updates the moment a subscriber
                clicks cancel. No refresh needed.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-xl font-semibold">No cancels caught yet</h2>
              <p className="mt-2 max-w-[44ch] text-muted">
                The widget isn&apos;t live on your site. Install it to start
                catching cancels. It takes one script tag.
              </p>
              <Link href="/install" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">
                Install the widget
              </Link>
            </>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <Card className="animate-rise [animation-delay:80ms]">
            <h2 className="text-lg font-semibold">Why they cancel</h2>
            <p className="text-sm text-muted">Last {stats.recent.length} sessions</p>
            <ul className="mt-5 space-y-4">
              {reasonCounts.map((r) => (
                <li key={r.value}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{r.label}</span>
                    <span className="tnum font-semibold">{r.n}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${(r.n / maxReason) * 100}%` }} />
                  </div>
                </li>
              ))}
              {reasonCounts.length === 0 && <li className="text-sm text-muted">No reasons recorded yet.</li>}
            </ul>
          </Card>

          <Card className="animate-rise overflow-x-auto p-0 [animation-delay:160ms]">
            <h2 className="px-6 pt-6 text-lg font-semibold">Recent sessions</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="px-6 py-3 font-medium">Reason</th>
                  <th className="px-6 py-3 font-medium">Outcome</th>
                  <th className="px-6 py-3 text-right font-medium">MRR</th>
                  <th className="px-6 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((s, i) => {
                  const o = OUTCOME_LABELS[s.outcome] ?? OUTCOME_LABELS.open;
                  return (
                    <tr key={i} className="border-b border-border transition-colors last:border-0 hover:bg-mist/60">
                      <td className="px-6 py-3.5">{reasonLabel(s.reason)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-2 whitespace-nowrap font-medium ${o.className}`}>
                          <span className={`h-2 w-2 rounded-full ${o.dot}`} />
                          {o.label}
                        </span>
                      </td>
                      <td className="tnum px-6 py-3.5 text-right">{money(s.mrrCents, s.currency)}</td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-muted">
                        {new Date(s.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
