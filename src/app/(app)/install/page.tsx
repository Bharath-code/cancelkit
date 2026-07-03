"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { InstallSnippet } from "@/components/features/InstallSnippet";
import { useSessionToken } from "@/components/features/SessionContext";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="max-w-[720px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Install the widget</h1>
        <p className="mt-1 text-sm text-muted">
          One script tag plus a two-line HMAC. Count it inside the five minutes.
        </p>
      </div>

      {(billing === null || billing?.status === "none") && (
        <div className="rounded-md bg-warning-surface px-4 py-3 text-sm text-warning">
          Copy the snippet now, pay to activate —{" "}
          <a href="/billing" className="font-semibold underline">
            subscribe to go live, $24/mo founder rate
          </a>
          . Live customer sessions stay off until then (previews still work).
        </div>
      )}

      <InstallSnippet publicKey={account.publicKey} />

      <Card>
        <h2 className="text-sm font-semibold">Your widget secret</h2>
        <p className="mt-1 text-xs text-muted">
          Keyed HMAC of each customer id — keeps anyone else from spoofing
          cancel flows for your customers. Server-side only, never in HTML.
        </p>
        <div className="mt-3">
          {showSecret && secret ? (
            <CodeBlock code={secret} />
          ) : (
            <div className="flex items-center gap-3">
              <code className="rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm text-muted">
                ••••••••••••••••••••••••••••••••
              </code>
              <button
                onClick={() => setShowSecret(true)}
                className="text-sm text-accent hover:underline"
              >
                Reveal
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              live ? "bg-success" : "animate-pulse bg-warning"
            }`}
          />
          <div>
            <h2 className="text-sm font-semibold">
              {live ? "Widget is live" : "Listening for your widget…"}
            </h2>
            <p className="text-xs text-muted">
              {live && account.lastHeartbeatAt
                ? `Last heartbeat ${new Date(account.lastHeartbeatAt).toLocaleString()}`
                : "This flips green the moment the script tag loads on your page — no refresh needed."}
            </p>
          </div>
        </div>

        {!live && stalled && (
          <div className="mt-4 rounded-md bg-warning-surface p-4 text-sm text-warning">
            <p className="font-semibold">Still nothing after 10 minutes — check these:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li>Script tag placed before <code>&lt;/body&gt;</code> on a page that actually loaded?</li>
              <li>Content-Security-Policy blocking <code>{process.env.NEXT_PUBLIC_APP_URL}</code>? Add it to <code>script-src</code> and <code>frame-src</code>.</li>
              <li>Ad-blocker active in your test browser? Try a private window.</li>
              <li>Using <code>data-selector</code>? Confirm it matches your cancel button.</li>
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
