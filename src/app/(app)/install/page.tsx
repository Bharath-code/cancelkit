"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { HmacSnippet, ScriptTagSnippet } from "@/components/features/InstallSnippet";
import { useSessionToken } from "@/components/features/SessionContext";
import { CodeBlock } from "@/components/ui/code-block";
import { capture } from "@/lib/posthog";

const STALL_MS = 10 * 60 * 1000;

export default function InstallPage() {
  const sessionToken = useSessionToken();
  const account = useQuery(api.accounts.current, { sessionToken });
  const secret = useQuery(api.accounts.widgetSecret, { sessionToken });
  const billing = useQuery(api.billing.current, { sessionToken });
  const [showSecret, setShowSecret] = useState(false);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    capture("install_page_viewed");
    const t = setTimeout(() => setStalled(true), STALL_MS);
    return () => clearTimeout(t);
  }, []);

  const live = account?.widgetStatus === "live";
  useEffect(() => {
    if (live) capture("widget_live");
  }, [live]);

  if (account === undefined) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />;
  }
  if (account === null) {
    return <p className="text-sm text-muted">Session expired — reconnect from the landing page.</p>;
  }

  const steps = [
    {
      title: "Sign the customer on your server",
      body: "Each time you render the page with your cancel button, sign the Stripe customer id plus the current time. Signatures expire after an hour, so a leaked one goes stale.",
      content: (
        <div className="space-y-4">
          <HmacSnippet />
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Your widget secret</p>
                <p className="text-sm text-muted">Server-side only. Never put it in HTML.</p>
              </div>
              {!(showSecret && secret) && (
                <button onClick={() => setShowSecret(true)} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-mist">
                  Reveal
                </button>
              )}
            </div>
            {showSecret && secret && <div className="mt-3"><CodeBlock label="CANCELKIT_WIDGET_SECRET" code={secret} /></div>}
          </div>
        </div>
      ),
    },
    {
      title: "Add the script tag",
      body: "Paste it on the page with your cancel button, filling in the three values from step 1. Point data-selector at your cancel button.",
      content: <ScriptTagSnippet publicKey={account.publicKey} />,
    },
    {
      title: "Load the page once",
      body: "The widget checks in when the script loads, and this step turns green on its own. No refresh needed.",
      content: (
        <div className={`rounded-lg border p-5 transition-colors ${live ? "border-success/30 bg-success-surface" : "border-border bg-surface"}`} aria-live="polite">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true" fill="none">
              {live ? (
                <>
                  <circle cx="24" cy="24" r="22" fill="#0B9A6D" />
                  <path d="M15 24.5l6 6 12-13" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" className="animate-draw" style={{ ["--len" as string]: 30 }} />
                </>
              ) : (
                <>
                  {[0, 0.8, 1.6].map((d) => (
                    <circle key={d} cx="24" cy="24" r="6" stroke="#FFB400" strokeWidth="2" className="motion-only">
                      <animate attributeName="r" values="6;22" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                  <circle cx="24" cy="24" r="6" fill="#FFB400" />
                </>
              )}
            </svg>
            <div>
              <p className="font-semibold">{live ? "Your widget is live" : "Listening for your widget"}</p>
              <p className="text-sm text-muted">
                {live && account.lastHeartbeatAt
                  ? `Last check-in ${new Date(account.lastHeartbeatAt).toLocaleString()}`
                  : "Open the page with the script tag in any browser."}
              </p>
            </div>
          </div>

          {!live && stalled && (
            <div className="mt-5 rounded-md bg-warning-surface p-4 text-sm text-warning">
              <p className="font-semibold">Nothing after 10 minutes? Check these:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Is the script tag before <code>&lt;/body&gt;</code>, on a page that actually loaded?</li>
                <li>Is a Content-Security-Policy blocking <code>{process.env.NEXT_PUBLIC_APP_URL}</code>? Add it to <code>script-src</code> and <code>frame-src</code>.</li>
                <li>Is an ad blocker on in your test browser? Try a private window.</li>
                <li>Using <code>data-selector</code>? Make sure it matches your cancel button.</li>
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[760px]">
      <h1 className="text-[32px] font-bold leading-tight">Install the widget</h1>
      <p className="mt-1 text-muted">A few lines on your server, one tag on your page.</p>

      {(billing === null || billing?.status === "none") && (
        <div className="mt-6 rounded-lg border border-warning/30 bg-warning-surface px-5 py-4 text-sm">
          You can copy everything now. Real subscribers see the flow once you{" "}
          <a href="/billing" className="font-semibold underline underline-offset-4">
            subscribe at the $24/mo founder rate
          </a>
          . Until then they get your normal cancel button, and the preview still works.
        </div>
      )}

      <ol className="mt-10">
        {steps.map((st, i) => {
          const done = i === 2 && live;
          return (
            <li key={st.title} className="relative grid grid-cols-[40px_1fr] gap-x-5 pb-12 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-[19px] top-11 bottom-1 w-0.5 rounded-full bg-border" aria-hidden="true" />
              )}
              <span
                className={`font-display grid h-10 w-10 place-items-center rounded-full text-base font-bold ${
                  done ? "bg-jade text-white" : "bg-ink text-white"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 animate-rise" style={{ animationDelay: `${i * 90}ms` }}>
                <h2 className="pt-1.5 text-xl font-semibold">{st.title}</h2>
                <p className="mt-1 max-w-[60ch] text-muted">{st.body}</p>
                <div className="mt-5">{st.content}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
