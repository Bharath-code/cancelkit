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
import type {
  EmbedToLoaderMessage,
  LoaderToEmbedMessage,
} from "@/lib/widget-protocol";

const API_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";

type SessionPayload = {
  sessionId: string;
  offer: FlowOffer;
  subscription: FlowSubscription;
  branding: FlowBranding;
};

// Host origin is unknown until the loader's init arrives. Only "ready"
// (no payload) goes out before that; everything after targets the host.
let hostOrigin: string | null = null;

function postToLoader(msg: EmbedToLoaderMessage) {
  window.parent.postMessage(msg, msg.type === "ready" ? "*" : (hostOrigin ?? "null"));
}

function waitForInit(): Promise<LoaderToEmbedMessage> {
  return new Promise((resolve) => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window.parent) return;
      const m = e.data as LoaderToEmbedMessage;
      if (m?.source !== "cancelkit" || m.type !== "init") return;
      window.removeEventListener("message", onMessage);
      hostOrigin = e.origin;
      resolve(m);
    }
    window.addEventListener("message", onMessage);
  });
}

function EmbedInner() {
  const params = useSearchParams();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; payload: SessionPayload }
    | { kind: "blocked" } // failopen already sent — show nothing actionable
  >({ kind: "loading" });
  const startedRef = useRef(false);

  useEffect(() => {
    // Reject top-level navigation — this page only works inside the iframe.
    if (window.self === window.top) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const publicKey = params.get("pk") ?? "";
    const init = waitForInit();
    postToLoader({ source: "cancelkit", type: "ready" });

    (async () => {
      try {
        const { customerId, hmac, ts } = await init;
        const res = await fetch(`${API_URL}/widget/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey, customerId, hmac, ts }),
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
        setState({ kind: "ready", payload });
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
          className="h-6 w-6 motion-safe:animate-spin rounded-full border-2 border-border border-t-primary"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (state.kind === "blocked") return null;

  const { payload } = state;

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
