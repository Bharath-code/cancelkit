"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useSessionToken } from "@/components/features/SessionContext";
import { Button } from "@/components/ui/button";
import { capture } from "@/lib/posthog";
import type { EmbedToLoaderMessage, LoaderToEmbedMessage } from "@/lib/widget-protocol";

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
  const selfEmbedParams = useMutation(api.billing.selfEmbedParams);
  const overview = useAction(api.billing.overview);
  const createCheckout = useAction(api.billing.createCheckout);
  const createPortal = useAction(api.billing.createPortal);

  const [nextInvoiceAt, setNextInvoiceAt] = useState<number | null>(null);
  const [priceCents, setPriceCents] = useState(2400);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embed, setEmbed] = useState<{ publicKey: string; customerId: string; hmac: string; ts: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

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

  // Dogfood: act as the loader — hand over the signed params on "ready",
  // close on resolution, return focus to the trigger.
  useEffect(() => {
    if (!embed) return;
    function closeEmbed() {
      setEmbed(null);
      cancelBtnRef.current?.focus();
    }
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      const msg = e.data as EmbedToLoaderMessage;
      if (!msg || msg.source !== "cancelkit" || !embed) return;
      if (msg.type === "ready") {
        const init: LoaderToEmbedMessage = { source: "cancelkit", type: "init", customerId: embed.customerId, hmac: embed.hmac, ts: embed.ts };
        iframeRef.current?.contentWindow?.postMessage(init, window.location.origin);
        iframeRef.current?.focus();
      }
      if (msg.type === "resolved" || msg.type === "dismissed" || msg.type === "failopen") closeEmbed();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeEmbed();
    }
    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey);
    };
  }, [embed]);

  async function openCancel() {
    setError(null);
    const params = await selfEmbedParams({ sessionToken }).catch(() => null);
    if (!params) {
      setError("The cancel flow isn't available right now. Use “Manage payment” to cancel in Stripe instead.");
      return;
    }
    setEmbed(params);
  }

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
    return <div className="h-56 max-w-[760px] animate-pulse rounded-xl bg-ink/90" />;
  }

  const status = billing?.status ?? "none";
  const subscribed = !(status === "none" || !billing);

  return (
    <div className="max-w-[760px] space-y-6">
      <h1 className="text-[32px] font-bold leading-tight">Billing</h1>
      {error && (
        <div role="alert" className="rounded-lg bg-error-surface px-5 py-4 text-sm text-error">{error}</div>
      )}

      {status === "past_due" && (
        <div className="rounded-lg border border-warning/30 bg-warning-surface px-5 py-4 text-sm text-warning">
          Your last payment failed. The widget keeps serving your subscribers
          for 14 days while you fix it. Update your payment method below.
        </div>
      )}

      <section className="ink-grid animate-rise overflow-hidden rounded-xl p-7 text-white sm:p-9">
        {!subscribed ? (
          <>
            <p className="text-[#C9D3E1]">Founder rate</p>
            <p className="font-display mt-1 text-[64px] font-extrabold leading-none tracking-[-0.04em]">
              {money(2400)}<span className="text-2xl font-semibold text-[#8FA0BA]">/mo</span>
            </p>
            <p className="mt-4 max-w-[48ch] text-[#C9D3E1]">
              The widget goes live the moment checkout completes. You keep this
              rate for as long as you stay, with a 30-day refund, no questions.
            </p>
            <Button variant="marigold" className="mt-7" disabled={busy} onClick={() => void go(createCheckout)}>
              {busy ? "Opening checkout…" : "Subscribe for $24/mo"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[#C9D3E1]">CancelKit</p>
                <p className="font-display mt-1 text-[56px] font-extrabold leading-none tracking-[-0.04em]">
                  {money(priceCents)}<span className="text-2xl font-semibold text-[#8FA0BA]">/mo</span>
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${status === "active" ? "bg-[#34D399]/15 text-[#5FE0B0]" : "bg-marigold/15 text-marigold"}`}>
                <span className={`h-2 w-2 rounded-full ${status === "active" ? "bg-[#34D399]" : "bg-marigold"}`} />
                {status === "active" ? "Active" : status === "past_due" ? "Payment failed" : status}
              </span>
            </div>
            {nextInvoiceAt && (
              <p className="mt-4 text-[#C9D3E1]">
                Next invoice on {new Date(nextInvoiceAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button variant="marigold" disabled={busy} onClick={() => void go(createPortal)}>
                {status === "past_due" ? "Update payment method" : "Manage payment"}
              </Button>
              <button ref={cancelBtnRef} onClick={() => void openCancel()} className="rounded-full px-4 py-2 text-sm text-[#AAB6C8] underline-offset-4 hover:text-white hover:underline">
                Cancel CancelKit
              </button>
            </div>
          </>
        )}
      </section>

      {subscribed && (
        <p className="text-sm text-muted">
          Canceling runs through CancelKit itself, the same flow your
          subscribers see.
        </p>
      )}

      {embed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
          onClick={() => { setEmbed(null); cancelBtnRef.current?.focus(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Cancel CancelKit"
        >
          <iframe
            ref={iframeRef}
            src={`/embed?pk=${encodeURIComponent(embed.publicKey)}`}
            className="h-[640px] w-full max-w-[480px] animate-rise rounded-xl bg-surface shadow-[var(--shadow-modal)]"
            title="Cancel CancelKit"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
