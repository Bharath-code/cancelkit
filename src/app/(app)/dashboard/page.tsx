"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSessionToken } from "@/components/features/SessionContext";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { REASONS } from "@/lib/constants";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const OUTCOME_LABELS: Record<string, { label: string; className: string }> = {
  saved_pause: { label: "Saved — pause", className: "bg-success-surface text-success" },
  saved_coupon: { label: "Saved — coupon", className: "bg-success-surface text-success" },
  canceled: { label: "Canceled", className: "bg-error-surface text-error" },
  abandoned: { label: "Abandoned", className: "bg-background text-muted" },
  open: { label: "In progress", className: "bg-warning-surface text-warning" },
};

export default function DashboardPage() {
  const sessionToken = useSessionToken();
  const stats = useQuery(api.cancelSessions.stats, { sessionToken });

  if (stats === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  const reasonLabel = (r?: string) =>
    REASONS.find((x) => x.value === r)?.label ?? "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Offers shown" value={String(stats.offersShown)} />
        <StatCard label="Saves" value={String(stats.saves)} success={stats.saves > 0} />
        <StatCard
          label="Save rate"
          value={`${Math.round(stats.saveRate * 100)}%`}
        />
        <StatCard
          label="MRR retained"
          value={money(stats.savedMrrCents)}
          success={stats.savedMrrCents > 0}
        />
      </div>

      {stats.recent.length === 0 ? (
        <Card>
          {stats.widgetStatus === "live" ? (
            <p className="text-sm text-muted">
              No cancel sessions yet. The widget is live and listening — this
              page fills in the moment someone clicks cancel.
            </p>
          ) : (
            <p className="text-sm text-muted">
              No cancel sessions yet — the widget isn&apos;t live.{" "}
              <Link href="/install" className="text-accent hover:underline">
                Install it
              </Link>{" "}
              to start catching cancels.
            </p>
          )}
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Outcome</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((s, i) => {
                const o = OUTCOME_LABELS[s.outcome] ?? OUTCOME_LABELS.open;
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-6 py-3">{reasonLabel(s.reason)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.className}`}>
                        {o.label}
                      </span>
                    </td>
                    <td className="tnum px-6 py-3">{money(s.mrrCents)}/mo</td>
                    <td className="px-6 py-3 text-muted">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
