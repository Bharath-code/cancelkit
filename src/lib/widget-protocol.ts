// postMessage protocol between the embed iframe and the loader.
// Twin: widget/src/types.ts — keep in sync.

export type ResolveOutcome =
  | "saved_pause"
  | "saved_coupon"
  | "canceled"
  | "abandoned";

export type EmbedToLoaderMessage =
  | { source: "cancelkit"; type: "ready" }
  | {
      source: "cancelkit";
      type: "resolved";
      outcome: ResolveOutcome;
      // true when the subscriber chose cancel but CancelKit's cancel call
      // failed — the loader must release the original click (fail-open).
      cancelFailed?: boolean;
    }
  | { source: "cancelkit"; type: "dismissed" }
  // Embed could not serve (invalid HMAC, kill switch, billing lapsed, API
  // down): loader releases the original click and no-ops for the page load.
  | { source: "cancelkit"; type: "failopen"; reason?: string };
