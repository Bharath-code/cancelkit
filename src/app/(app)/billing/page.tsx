"use client";

import { useAction, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useSessionToken } from "@/components/features/SessionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { capture } from "@/lib/posthog";
import type { EmbedToLoaderMessage } from "@/lib/widget-protocol";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BillingPage() {
  const sessionToken = useSessionToken();
  const billing = useQuery(api.billing.current, { sessionToken });
  const embedParams = useQuery(api.billing.selfEmbedParams, { sessionToken });
  const overview = useAction(api.billing.overview);
  const createCheckout = useAction(api.billing.createCheckout);
  const createPortal = useAction(api.billing.createPortal);

  const [nextInvoiceAt, setNextInvoiceAt] = useState<number | null>(null);
  const [priceCents, setPriceCents] = useState(2400);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("status") === "success") {
      capture("checkout_completed");
    }
    overview({ sessionToken })
      .then((o) => {
        if (o) {
          setNextInvoiceAt(o.nextInvoiceAt);
          setPriceCents(o.priceCents);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dogfood: close the embed on resolution, like the real loader does.
  useEffect(() => {
    if (!cancelOpen) return;
    function onMessage(e: MessageEvent) {
      const msg = e.data as EmbedToLoaderMessage;
      if (!msg || msg.source !== "cancelkit") return;
      if (msg.type === "resolved" || msg.type === "dismissed" || msg.type === "failopen") {
        setCancelOpen(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [cancelOpen]);

  async function go(fn: typeof createCheckout) {
    setBusy(true);
    setError(null);
    try {
      const { url } = await fn({ sessionToken });
      window.location.href = url;
    } catch {
      setError(
        "Stripe checkout isn't configured yet (STRIPE_FOUNDER_PRICE_ID) — see docs/stripe-setup.md § 5."
      );
      setBusy(false);
    }
  }

  if (billing === undefined) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />;
  }

  const status = billing?.status ?? "none";

  return (
    <div className="max-w-[720px] space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      {error && (
        <div className="rounded-md bg-error-surface px-4 py-3 text-sm text-error">{error}</div>
      )}

      {status === "past_due" && (
        <div className="rounded-md bg-warning-surface px-4 py-3 text-sm text-warning">
          Your last payment failed. The widget keeps serving your customers for
          14 days while you fix it — update your payment method below.
        </div>
      )}

      {status === "none" || !billing ? (
        <Card>
          <h2 className="text-lg font-semibold">Founder rate — {money(2400)}/mo</h2>
          <p className="mt-2 text-sm text-muted">
            One saved $99 customer covers four months. Widget goes live the
            moment checkout completes; 30-day refund, no questions.
          </p>
          <div className="mt-4">
            <Button disabled={busy} onClick={() => void go(createCheckout)}>
              {busy ? "Opening checkout…" : "Subscribe — $24/mo"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">CancelKit — {money(priceCents)}/mo</h2>
              <p className="mt-1 text-sm text-muted">
                Status:{" "}
                <span className={status === "active" ? "text-success" : "text-warning"}>
                  {status}
                </span>
                {nextInvoiceAt &&
                  ` · next invoice ${new Date(nextInvoiceAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" disabled={busy} onClick={() => void go(createPortal)}>
              {status === "past_due" ? "Update payment method" : "Manage payment"}
            </Button>
            {embedParams && (
              <Button variant="cancel-ghost" onClick={() => setCancelOpen(true)}>
                Cancel CancelKit
              </Button>
            )}
          </div>
        </Card>
      )}

      {cancelOpen && embedParams && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4"
          onClick={() => setCancelOpen(false)}
        >
          <iframe
            src={`/embed?pk=${embedParams.publicKey}&customer=${embedParams.customerId}&hmac=${embedParams.hmac}`}
            className="h-[640px] w-full max-w-[480px] rounded-lg bg-surface shadow-[0_8px_30px_rgba(22,24,29,0.12)]"
            title="Cancel CancelKit"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
