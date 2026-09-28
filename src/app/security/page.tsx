import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Security — CancelKit",
  description:
    "What access CancelKit gets to your Stripe account, every call our code makes with it, and the mechanisms around them.",
};

const reads = [
  ["accounts.retrieve", "Your business name, logo and brand color, for the flow's header"],
  ["prices.list, coupons.list / retrieve", "Your active plans and coupons, to build the preview and offer"],
  ["subscriptions.list / retrieve", "The subscriber's current plan and price, and to verify every write"],
  ["fileLinks.create", "A public link to your Stripe-hosted logo"],
];

const writes = [
  ["subscriptions.update", "Pause collection with a resume date, or apply one of your existing coupons"],
  ["subscriptions.cancel", "Cancel, only when the subscriber chooses “Cancel anyway”"],
];

const never = [
  "Issue charges or refunds, or touch payouts",
  "Create coupons, change prices, or switch a subscriber's plan",
  "Act on a subscriber your own page didn't sign a request for",
  "Store a Stripe API key. Access rides the OAuth grant, which you can revoke in Stripe at any time",
];

function CallTable({ rows }: { rows: string[][] }) {
  return (
    <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map(([call, why]) => (
        <div key={call} className="grid gap-1 px-5 py-4 sm:grid-cols-[230px_1fr] sm:gap-6">
          <dt className="font-mono text-[13px] text-on-surface">{call}</dt>
          <dd className="text-sm text-muted">{why}</dd>
        </div>
      ))}
    </dl>
  );
}

// Trust-boundary diagram: host page ↔ isolated frame ↔ CancelKit ↔ Stripe.
function BoundaryDiagram() {
  const box = "#FFFFFF";
  return (
    <svg viewBox="0 0 720 200" className="h-auto w-full" role="img" aria-label="Your page passes a signed, expiring request to the CancelKit frame by message. The frame talks to CancelKit's server, which alone talks to Stripe.">
      <defs>
        <marker id="bd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#52617A" />
        </marker>
      </defs>
      <rect x="10" y="30" width="276" height="140" rx="16" fill="#EEF2F6" stroke="#D8DFE8" />
      <text x="30" y="58" fontSize="14" fontWeight="600" fill="#0F1E36">Your page</text>
      <rect x="36" y="80" width="226" height="72" rx="12" fill={box} stroke="#0F1E36" strokeWidth="2" />
      <text x="56" y="108" fontSize="13" fontWeight="600" fill="#0F1E36">CancelKit frame</text>
      <text x="56" y="130" fontSize="12" fill="#52617A">isolated origin</text>
      <rect x="330" y="80" width="160" height="72" rx="12" fill="#0F1E36" />
      <text x="350" y="108" fontSize="13" fontWeight="600" fill="#FFFFFF">CancelKit server</text>
      <text x="350" y="130" fontSize="12" fill="#AAB6C8">verifies signature</text>
      <rect x="560" y="80" width="150" height="72" rx="12" fill="#635BFF" />
      <text x="580" y="108" fontSize="13" fontWeight="600" fill="#FFFFFF">Stripe</text>
      <text x="580" y="130" fontSize="12" fill="#E0DEFF">every call listed below</text>
      <path d="M288 116H326" stroke="#52617A" strokeWidth="2" markerEnd="url(#bd-arrow)" />
      <path d="M492 116H556" stroke="#52617A" strokeWidth="2" markerEnd="url(#bd-arrow)" />
      <text x="34" y="192" fontSize="12" fill="#52617A">signed request, expires in 1 hour, sent by message (never in a URL)</text>
    </svg>
  );
}

// Static prose page — readable without JS (FR-017).
export default function SecurityPage() {
  return (
    <div className="flex-1">
      <header className="ink-grid text-white">
        <div className="mx-auto flex h-16 max-w-[880px] items-center px-4 sm:px-6">
          <Link href="/" aria-label="CancelKit home"><Logo onInk /></Link>
        </div>
        <div className="mx-auto max-w-[880px] px-4 pb-16 pt-10 sm:px-6">
          <h1 className="animate-rise text-[clamp(36px,6vw,60px)] font-extrabold leading-[1] tracking-[-0.03em]">
            What CancelKit can touch, exactly.
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg text-[#C9D3E1]">
            You&apos;re connecting a stranger to your billing, so check first.
            Here&apos;s the access Stripe grants, every call our code makes with
            it, and what keeps those calls honest.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-4 py-16 sm:px-6">
        <section className="rounded-lg border border-warning/30 bg-warning-surface p-6">
          <h2 className="text-xl font-semibold">The access is broad. Our use of it is narrow.</h2>
          <p className="mt-2 text-[15px]">
            CancelKit connects with Stripe Connect OAuth. For this connection
            type Stripe issues a <code className="font-mono text-sm">read_write</code>{" "}
            grant covering the whole account, and it can&apos;t be narrowed. We
            won&apos;t pretend otherwise. What we can show you is the complete
            list of calls our code makes, below. A scoped Stripe App version is
            on the roadmap.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">How a cancel click travels</h2>
          <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
            <BoundaryDiagram />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">What our code reads</h2>
          <div className="mt-5"><CallTable rows={reads} /></div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">What our code changes</h2>
          <div className="mt-5"><CallTable rows={writes} /></div>
          <p className="mt-3 text-sm text-muted">
            Cancellation today is immediate with no proration, the same as a
            bare Stripe cancel button.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">What our code never does</h2>
          <ul className="mt-5 space-y-3">
            {never.map((n) => (
              <li key={n} className="flex gap-3">
                <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" fill="none">
                  <circle cx="10" cy="10" r="9" fill="#FDECEB" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#C2372B" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 space-y-10">
          <h2 className="text-2xl font-bold">The mechanisms</h2>
          {[
            ["Isolated frame", "The flow runs in a frame on our domain. Your page's CSS and scripts can't reach into it, and it can't reach into your page. The only message sent before the handshake is a bare “ready” signal with no data. Everything after it goes only to your page's origin."],
            ["Signed, expiring requests", "Your server signs the customer id plus a timestamp with a secret only you and CancelKit hold (HMAC-SHA256). We reject a signature once it's an hour old. It reaches the frame by message, not in a URL, so it doesn't end up in server logs or browser history."],
            ["Idempotent billing changes", "Every Stripe change carries an idempotency key tied to the cancel session. We report success only after reading the subscription back and checking its state. Double-clicks, retries and replayed webhooks cause one change, not two. Every webhook is signature-checked and deduplicated."],
            ["Kill switch and fail-open", "One toggle in settings turns the widget off for everyone, instantly. If CancelKit fails in any way (network, outage, bad signature), your own cancel button runs. A broken save flow never blocks a cancellation."],
            ["No dark patterns, by construction", "“Cancel my subscription anyway” is visible and enabled at every step. That's how the component is built, not a policy we promise to follow."],
          ].map(([t, d]) => (
            <div key={t} className="grid gap-2 sm:grid-cols-[220px_1fr] sm:gap-8">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="text-muted">{d}</p>
            </div>
          ))}
        </section>

        <p className="mt-16 border-t border-border pt-6 text-sm text-muted">
          Want to check for yourself? The widget loader is served readable at{" "}
          <code className="font-mono">/v1/cancelkit.js</code>. Read what would
          run on your page before you paste it.
        </p>
      </main>
    </div>
  );
}
