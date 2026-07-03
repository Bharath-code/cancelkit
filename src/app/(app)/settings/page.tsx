"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { PreviewData } from "../../../../convex/stripe";
import { useSessionToken } from "@/components/features/SessionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PAUSE_DAYS } from "@/lib/constants";

export default function SettingsPage() {
  const sessionToken = useSessionToken();
  const account = useQuery(api.accounts.current, { sessionToken });
  const updateSettings = useMutation(api.accounts.updateSettings);
  const previewData = useAction(api.stripe.previewData);

  const [coupons, setCoupons] = useState<PreviewData["coupons"] | null>(null);
  const [confirm, setConfirm] = useState<"kill" | "rotate" | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    previewData({ sessionToken })
      .then((d) => setCoupons(d.coupons.filter((c) => c.valid)))
      .catch(() => setCoupons([])); // Stripe unreachable — pause-only config still works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (account === undefined) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />;
  }
  if (account === null) {
    return <p className="text-sm text-muted">Session expired — reconnect from the landing page.</p>;
  }

  async function save(patch: Parameters<typeof updateSettings>[0], label: string) {
    setSaving(label);
    setError(null);
    try {
      await updateSettings(patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed — try again.");
    } finally {
      setSaving(null);
    }
  }

  const killed = account.widgetStatus === "killed";

  return (
    <div className="max-w-[720px] space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {error && (
        <div className="rounded-md bg-error-surface px-4 py-3 text-sm text-error">{error}</div>
      )}

      <Card>
        <h2 className="text-sm font-semibold">Offer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-muted">Pause length</span>
            <select
              value={account.offerConfig.pauseDays}
              disabled={saving === "pause"}
              onChange={(e) =>
                void save(
                  { sessionToken, pauseDays: Number(e.target.value) },
                  "pause"
                )
              }
              className="mt-1 block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
            >
              {PAUSE_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-muted">Coupon offer</span>
            <select
              value={account.offerConfig.couponId ?? ""}
              disabled={saving === "coupon" || coupons === null}
              onChange={(e) =>
                void save(
                  { sessionToken, couponId: e.target.value || null },
                  "coupon"
                )
              }
              className="mt-1 block h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">None — offer a pause instead</option>
              {(coupons ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (
                  {c.percentOff
                    ? `${c.percentOff}% off`
                    : `$${((c.amountOffCents ?? 0) / 100).toFixed(2)} off`}
                  , {c.duration})
                </option>
              ))}
            </select>
          </label>
        </div>
        {coupons !== null && coupons.length === 0 && (
          <p className="mt-2 text-xs text-muted">
            No valid coupons found on your Stripe account — the widget offers a pause.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Kill switch</h2>
        <p className="mt-1 text-xs text-muted">
          Instantly disables the widget for all your customers. Native cancel
          behavior resumes on their next click.
        </p>
        <div className="mt-3">
          {killed ? (
            <Button variant="secondary" onClick={() => void save({ sessionToken, killSwitch: false }, "kill")}>
              Re-enable the widget
            </Button>
          ) : (
            <button
              onClick={() => setConfirm("kill")}
              className="h-10 rounded-md border border-error px-5 py-2.5 text-sm font-medium text-error hover:bg-error-surface"
            >
              Disable the widget
            </button>
          )}
          {killed && (
            <span className="ml-3 rounded-full bg-warning-surface px-3 py-1 text-xs font-medium text-warning">
              Widget disabled
            </span>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Widget secret</h2>
        <p className="mt-1 text-xs text-muted">
          Rotating kills every HMAC computed with the old secret — your cancel
          button stops opening CancelKit (and fails open to native cancel)
          until you deploy the new secret.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => setConfirm("rotate")}>
            Rotate secret
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">What CancelKit can touch</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
          <li>Pause collection on a subscription (with a resume date)</li>
          <li>Apply one of your existing coupons to a subscription</li>
          <li>Cancel a subscription when the subscriber asks</li>
          <li>Read plans, coupons, and branding to build the flow</li>
        </ul>
        <p className="mt-2 text-xs text-muted">
          Never: charges, refunds, payouts, creating prices or coupons, or any
          customer not presented by your own page with a valid HMAC.{" "}
          <a href="/security" className="text-accent hover:underline">
            Full mechanisms →
          </a>
        </p>
      </Card>

      <Modal open={confirm !== null} onDismiss={() => setConfirm(null)}>
        <h2 className="text-lg font-semibold">
          {confirm === "kill" ? "Disable the widget?" : "Rotate the widget secret?"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {confirm === "kill"
            ? "This disables the widget for all your customers instantly. Native cancel behavior resumes."
            : "Old HMACs die immediately. Copy the new snippet to your server right after, or your widget fails open until you do."}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="cancel-ghost" onClick={() => setConfirm(null)}>
            Never mind
          </Button>
          <Button
            onClick={() => {
              const which = confirm;
              setConfirm(null);
              if (which === "kill") void save({ sessionToken, killSwitch: true }, "kill");
              if (which === "rotate") void save({ sessionToken, rotateSecret: true }, "rotate");
            }}
          >
            {confirm === "kill" ? "Disable it" : "Rotate it"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
