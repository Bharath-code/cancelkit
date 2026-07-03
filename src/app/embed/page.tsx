"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CancelFlow,
  FlowBranding,
  FlowOffer,
  FlowResolution,
  FlowSubscription,
  ResolveResult,
} from "@/components/features/CancelFlow";
import type { EmbedToLoaderMessage } from "@/lib/widget-protocol";

const API_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";

type SessionPayload = {
  sessionId: string;
  offer: FlowOffer;
  subscription: FlowSubscription;
  branding: FlowBranding;
};

function postToLoader(msg: EmbedToLoaderMessage) {
  // The loader validates origin; "*" is safe because the payload carries no
  // secrets and the loader ignores messages not shaped by our protocol.
  window.parent.postMessage(msg, "*");
}

function EmbedInner() {
  const params = useSearchParams();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; payload: SessionPayload; sandbox: boolean }
    | { kind: "blocked" } // failopen already sent — show nothing actionable
  >({ kind: "loading" });
  const startedRef = useRef(false);

  useEffect(() => {
    // Reject top-level navigation — this page only works inside the iframe.
    if (window.self === window.top) return;
    if (startedRef.current) return;
    startedRef.current = true;

    postToLoader({ source: "cancelkit", type: "ready" });

    const publicKey = params.get("pk") ?? "";
    const customerId = params.get("customer") ?? "";
    const hmac = params.get("hmac") ?? "";
    const sandbox = params.get("sandbox") === "1";

    (async () => {
      try {
        const res = await fetch(`${API_URL}/widget/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey, customerId, hmac, sandbox }),
        });
        if (!res.ok) {
          // invalid HMAC, kill switch, lapsed billing, no subscription —
          // release the native cancel and get out of the way.
          postToLoader({
            source: "cancelkit",
            type: "failopen",
            reason: String(res.status),
          });
          setState({ kind: "blocked" });
          return;
        }
        const payload = (await res.json()) as SessionPayload;
        setState({ kind: "ready", payload, sandbox });
      } catch {
        postToLoader({ source: "cancelkit", type: "failopen", reason: "network" });
        setState({ kind: "blocked" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof window !== "undefined" && window.self === window.top) {
    return (
      <main className="mx-auto max-w-[480px] p-8 text-sm text-muted">
        This page renders CancelKit&apos;s cancel flow inside your product via
        the script tag — it isn&apos;t meant to be opened directly.
      </main>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (state.kind === "blocked") return null;

  const { payload, sandbox } = state;

  async function onResolve(r: FlowResolution): Promise<ResolveResult> {
    try {
      const res = await fetch(`${API_URL}/widget/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: payload.sessionId,
          reason: r.reason ?? undefined,
          reasonText: r.reasonText,
          resolution: r.resolution,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.fallbackOffer) {
          return {
            outcome: "abandoned",
            error: typeof body.error === "string" ? body.error : undefined,
            retryOffer: body.fallbackOffer as FlowOffer,
          };
        }
        if (r.resolution === "cancel") {
          // CancelKit's cancel failed — the loader releases native behavior.
          postToLoader({
            source: "cancelkit",
            type: "resolved",
            outcome: "canceled",
            cancelFailed: true,
          });
          return { outcome: "canceled" };
        }
        return {
          outcome: "abandoned",
          error:
            typeof body?.error === "string"
              ? body.error
              : "Stripe isn't responding — nothing has changed on your subscription. Try again.",
        };
      }
      const outcome = body.outcome as ResolveResult["outcome"];
      postToLoader({ source: "cancelkit", type: "resolved", outcome });
      return { outcome, detail: body.detail };
    } catch {
      if (r.resolution === "cancel") {
        postToLoader({
          source: "cancelkit",
          type: "resolved",
          outcome: "canceled",
          cancelFailed: true,
        });
        return { outcome: "canceled" };
      }
      return {
        outcome: "abandoned",
        error:
          "The network dropped — nothing has changed on your subscription. Try again.",
      };
    }
  }

  function onDismiss() {
    // best-effort abandon record; the 30-min cron sweeps stragglers
    void fetch(`${API_URL}/widget/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        resolution: "dismiss",
      }),
      keepalive: true,
    }).catch(() => {});
    postToLoader({ source: "cancelkit", type: "dismissed" });
  }

  return (
    <div
      className="flex min-h-screen items-start justify-center"
      onKeyDown={(e) => {
        if (e.key === "Escape") onDismiss();
        if (e.key === "Tab") {
          // focus trap: the iframe participates in the host page's tab order,
          // so keep Tab cycling inside the flow (Esc is the way out)
          const focusable = document.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input, textarea, [href]'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <CancelFlow
        branding={payload.branding}
        subscription={payload.subscription}
        offer={payload.offer}
        onResolve={onResolve}
        onDismiss={onDismiss}
        sandbox={sandbox}
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedInner />
    </Suspense>
  );
}
