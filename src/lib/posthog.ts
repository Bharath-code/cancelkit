// Funnel events per PRD FR-018. Add here first — capture() is typed to this list.
export type CkEvent =
  | "landing_viewed"
  | "demo_opened"
  | "oauth_started"
  | "oauth_completed"
  | "preview_rendered"
  | "preview_render_failed"
  | "install_page_viewed"
  | "install_snippet_copied"
  | "widget_live"
  | "checkout_completed";

type PostHogLike = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  register: (props: Record<string, unknown>) => void;
};

// posthog-js is ~50KB gzip — loaded lazily so the landing page stays under
// its 200KB JS budget. Events fired before load resolve once it arrives.
let client: Promise<PostHogLike | null> | null = null;

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || client || typeof window === "undefined") return;
  client = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false, // no input autocapture — subscriber PII must never leak
      capture_pageview: false,
    });
    return posthog as unknown as PostHogLike;
  });
}

export function capture(event: CkEvent, props?: Record<string, unknown>) {
  void client?.then((ph) => ph?.capture(event, props));
}

// Joins every subsequent event to the account (FR-018) — no subscriber PII.
export function registerAccount(accountId: string) {
  void client?.then((ph) => ph?.register({ accountId }));
}
