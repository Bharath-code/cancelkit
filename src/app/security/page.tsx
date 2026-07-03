import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security — CancelKit",
  description:
    "Exactly what CancelKit can and cannot do with your Stripe account, and the mechanisms that enforce it.",
};

// Static prose page — readable without JS (FR-017).
export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-[720px] flex-1 px-6 py-16">
      <h1 className="text-[32px] font-bold leading-tight tracking-tight">
        What CancelKit can touch, exactly
      </h1>
      <p className="mt-4 text-muted">
        You&apos;re handing a stranger OAuth access to your billing. Correct
        instinct to check first. Here is the entire scope, in plain language,
        and the mechanisms that enforce it.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">The scope</h2>
      <p className="mt-3">
        CancelKit connects via Stripe Connect (standard OAuth). With that
        access we do exactly four things:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          <strong>Pause collection</strong> on a subscription —{" "}
          <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-sm">
            pause_collection: {"{"} behavior: &quot;void&quot; {"}"}
          </code>{" "}
          with a resume date. No proration surprises.
        </li>
        <li>
          <strong>Apply one of your existing coupons</strong> to a
          subscription. We never create coupons or change prices.
        </li>
        <li>
          <strong>Cancel a subscription</strong> when the subscriber asks —
          immediately, no proration, exactly what your bare cancel button did.
        </li>
        <li>
          <strong>Read</strong> your active plans, coupons, and account
          branding to build the flow.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">What we can never do</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>Issue charges or refunds, or touch payouts.</li>
        <li>Change plans or prices, or create new billing objects.</li>
        <li>See your bank details or your revenue beyond what the flow needs.</li>
        <li>
          Act on any customer your own page didn&apos;t present with a valid
          signature (see HMAC below).
        </li>
        <li>Store Stripe API keys — there are none to leak. Access rides the
          OAuth grant, which you can revoke from the Stripe dashboard at any
          moment; the widget dies instantly when you do.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">The mechanisms</h2>

      <h3 className="mt-6 text-lg font-semibold">Iframe isolation</h3>
      <p className="mt-2">
        The widget UI runs in a cross-origin iframe on our domain. Your
        page&apos;s CSS and JavaScript cannot touch it; it cannot touch your
        page. The two sides exchange a typed message protocol with strict
        origin checks — no <code className="font-mono text-sm">*</code> targets.
      </p>

      <h3 className="mt-6 text-lg font-semibold">Signed widget config (HMAC)</h3>
      <p className="mt-2">
        Your server signs each customer id with a secret only you and CancelKit
        hold (HMAC-SHA256). Without a valid signature, the widget refuses to
        act on live subscriptions — nobody can spoof pause or discount calls
        for your customers, including us being tricked into it.
      </p>

      <h3 className="mt-6 text-lg font-semibold">Idempotent billing mutations</h3>
      <p className="mt-2">
        Every Stripe mutation carries an idempotency key tied to the cancel
        session, and success is only reported after reading the subscription
        back and verifying the exact state. Double-clicks, retries, and
        replayed webhooks produce one mutation, not two. Every webhook is
        signature-verified and deduplicated by event id.
      </p>

      <h3 className="mt-6 text-lg font-semibold">Kill switch</h3>
      <p className="mt-2">
        One toggle in settings disables the widget for all your customers
        instantly. And if CancelKit itself ever fails — network, outage,
        anything — the widget fails open: your native cancel button keeps
        working. A broken save flow never blocks a cancellation.
      </p>

      <h3 className="mt-6 text-lg font-semibold">No dark patterns, structurally</h3>
      <p className="mt-2">
        &quot;Cancel my subscription anyway&quot; is rendered visible and
        enabled at every step of the flow. That&apos;s not a policy we promise
        to follow; it&apos;s how the component is built.
      </p>

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        Questions, or want to audit deeper? The widget loader source ships
        unminified-readable at{" "}
        <code className="font-mono">/v1/cancelkit.js</code> — read what runs on
        your page before you paste it.
      </p>
    </main>
  );
}
