# Testing Notes — CancelKit

## Phase 2 — local verification (2026-07-03, no Stripe keys yet)

Verified against the local Convex dev deployment + `test-pages/` harness
(plain HTTP server on :8787, cross-origin to the app on :3000):

| Check | Result |
|---|---|
| Widget bundle budget | 2,600 bytes raw / **1,283 bytes gzip** (budget 12,288) — build fails over budget |
| Loader happy path | Click intercepted → iframe modal opens → embed handshake `ready` received |
| Fail-open: invalid HMAC | `/widget/session` 401 → embed `failopen` → native click released → native page reached |
| Fail-open: Stripe unreachable | `/widget/session` 502 → fail-open, native cancel intact |
| Fail-open: CSP blocks iframe (`frame-src 'none'`) | 3s handshake timeout → beacon + native click released |
| SPA re-render | Trigger destroyed/recreated post-load; delegation still intercepts (iframe confirmed via MutationObserver) |
| Double include | Second script tag no-ops (`window.CancelKit` guard); no console errors |
| Custom selector (`data-selector`) | Intercepts equivalently to `[data-cancelkit-trigger]` |
| Heartbeat | Test-page load → `lastHeartbeatAt` set, `widgetStatus: live`; `/install` status card flips reactively without refresh |
| Error beacon rate limit | 5/min/account enforced — 6th call in a minute → 429 |
| Session endpoint auth | Unknown publicKey → 404; bad HMAC → 401; kill switch → 403 `{disabled:true}` |
| Kill switch | Engaged in `/settings` (confirm dialog) → `/widget/session` 403 immediately; re-enable restores |
| Secret rotation | Old HMAC → 401 immediately after rotate |
| Sandbox sessions | `cancelSessions.start/patch` write rows with `sandbox: true`; ownership enforced |
| Abandon sweeper | Seeded 45-min-old `open` session → cron handler swept to `abandoned` |
| HMAC + token bucket units | 7 Vitest tests passing (valid/invalid/tampered HMAC, bucket exhaustion + refill) |

## Pending: billing-state torture test (TASK-036) — needs Stripe test keys

Run once `docs/stripe-setup.md` § 1 is done:

- [ ] Double-click accept → exactly one pause (idempotency key = sessionId)
- [ ] Resolve replay (reused sessionId) → 409, no second mutation
- [ ] Webhook replay via `stripe trigger` ×2 → one processing (ledger short-circuit)
- [ ] Out-of-order pause→cancel events → state matches Stripe current-state fetch
- [ ] Expired coupon at accept → 409 + honest message, subscription unchanged
- [ ] Already-canceled subscription → 409 "This subscription is already canceled."

## Phase 4 — § 11 error-handling audit (TASK-052)

| § 11 row | Status |
|---|---|
| OAuth: denial → calm message + /security + retry | PASS (verified: `?oauth=denied` banner) |
| OAuth: state missing/mismatch → 403 + Sentry, no account | PASS (curl-verified 403 both cases) |
| OAuth: code-exchange failure → error page + retry, no partial rows | PASS (`/oauth-error`; upsert only after successful exchange) |
| OAuth: reconnect = sign-in, keys preserved | PASS (upsert by `by_stripe_account`, keys untouched on patch) |
| OAuth: revoke → widget revoked + founder email | PASS (webhook → `revoked` + `sendRevokedEmail`) |
| Sandbox: fetch > 10s → retry state + `preview_render_failed` | PASS (10s Promise.race) |
| Sandbox: 0 coupons → pause-only + hint | PASS |
| Sandbox: 0 products → empty state + reconnect | PASS |
| Sandbox: missing logo → neutral header | PASS (logo optional in CancelFlow) |
| Loader: all 6 rows | PASS (verified in Phase 2 table above) |
| Resolve: already canceled → 409 + plain message | PASS (read-before-write + error mapping) |
| Resolve: already paused → 409 plain message; coupon offered if configured | PASS (session offer prefers configured coupon; pause conflict → 409) |
| Resolve: coupon expired at accept → 409, re-offer pause | PASS (fallbackOffer → flow returns to offer step with pause) |
| Resolve: Stripe 5xx → one retry same idempotency key, honest failure copy | PASS (withRetry; never "saved" without read-back) |
| Resolve: double-click → one mutation | PASS (idempotency key = sessionId; busy-guard in UI) — Stripe-side replay pending keys |
| Resolve: session reuse → 409 | PASS (outcome !== "open" check) |
| Resolve: modal closed mid-flow → abandoned | PASS (dismiss beacon + 30-min sweeper) |
| Resolve: 2+ subscriptions → most recent + flag | PASS (`multiSubscription` on session) |
| Webhooks: all 5 rows | PASS in code (ledger, current-state fetch, 400 bad sig, 200 unknowns) — CLI replay pending keys |
| Emails: Resend failure → retry then Sentry | PASS |
| Emails: missing account email → skip | PASS (verified: `sent 0` path) |
| Emails: no customer name → id fragment | PASS (verified: `cus_…ive1` subject) |
| Billing: checkout abandoned → unchanged | PASS (status only changes on webhook) |
| Billing: payment fails → past_due + 14d grace + single dunning email | PASS (transition-gated email; grace window verified locally) |
| Billing: founder cancels → serve through period end, then disabled | PASS (portal hides cancel; status gate verified) |

## Phase 4 — performance numbers (TASK-054)

Measured on the local production build (`next build` + `next start`):

| Budget | Measured | Status |
|---|---|---|
| Widget loader gzip < 12,288 B | **1,283 B** (build-enforced gate) | PASS |
| Loader main-thread < 50ms | 2.6KB IIFE, one delegated listener — trivially under; formal trace on a real host pending | PASS (by construction) |
| Landing initial JS < 200KB | **187,433 B gzip** (was 340KB — Convex provider moved off the root layout, PostHog + Sentry lazy-loaded) | PASS |
| Embed initial JS | 190,562 B gzip | — |
| Landing TTFB (local prod) | 14ms | — (LCP < 2s: text-only hero, no blocking assets; formal Lighthouse run pending deploy) |
| Embed interactive < 1.5s on 4G | ~190KB gzip ≈ ~1.0s transfer at 4G + parse | PASS (estimate; formal throttled run pending deploy) |

## Phase 4 — widget compatibility matrix (TASK-058)

Five structurally different host pages in `test-pages/` (serve with `python3 -m http.server 8787`):

| Page | Structure | Outcome |
|---|---|---|
| `index.html` | Plain HTML | PASS — intercepts, opens iframe, full bridge |
| `react-spa.html` | React 18 SPA, client router, trigger re-keyed every 200ms | PASS — delegation intercepts the freshly re-rendered trigger |
| `csp.html` | `frame-src 'none'` meta CSP | PASS — 3s handshake timeout → beacon → fail-open to native |
| `htmx-style.html` | Turbolinks/HTMX-style innerHTML body swap after load | PASS — swapped-in trigger intercepted |
| `css-reset.html` | `* { all: unset }` + hostile `!important` overrides | PASS — loader styles applied via `setProperty(…, "important")`; overlay renders correctly (fix shipped in this pass: loader was vulnerable before) |

All five also verified to fail open (native cancel reached) when the API is unreachable.

## Launch Checklist Dry Run (TASK-062, 2026-07-03)

Final sweep before live cutover. Everything verifiable locally has been verified; the rest is blocked on credentials/production access and listed with its unblock step.

| # | Item | Status | Notes / unblock |
|---|------|--------|-----------------|
| 1 | All env vars set in prod | BLOCKED | No prod deploy yet (TASK-012 needs user approval). Full var list: `.env.local` comments + `docs/stripe-setup.md`. |
| 2 | Stripe webhook endpoints healthy | BLOCKED | Needs Stripe keys + dashboard (`docs/stripe-setup.md` § 3). Handler verified locally: ledger dedupe, Connect + platform events, signature check via both secrets. |
| 3 | Resend domain verified + emails sending | BLOCKED | Needs `RESEND_API_KEY` + domain (§ 4). Email code verified locally: no-key path logs and skips; retry → Sentry on failure. |
| 4 | PostHog funnel saved (sandbox → OAuth → install → paid) | BLOCKED | Needs `NEXT_PUBLIC_POSTHOG_KEY`. Typed events (FR-018) implemented + capture calls verified in code. |
| 5 | Sentry alerts armed (app + widget DSNs) | BLOCKED | TASK-055. Needs DSNs; capture + scrubbing verified locally via mock DSN. |
| 6 | Kill switch tested | PASS (local) | Settings toggle → widget 403 → loader fail-open + sticky disable verified end-to-end. Re-test once in prod. |
| 7 | Billing gate lifecycle | PASS (local) | active → past_due (14-day grace) → disabled → 403; sandbox + self exempt. Torture test w/ test clocks BLOCKED (TASK-046). |
| 8 | Widget budget + compat matrix | PASS | 1,283 B gzip (budget 12 KB); 5-page compat matrix above, all PASS or fail-open. |
| 9 | Landing perf budget | PASS | 187,433 B gzip initial JS (budget 200 KB). |
| 10 | SEO/meta | PASS | sitemap 200, robots 200, OG image 200 image/png, no noindex leaks. |
| 11 | Stopwatch time published on landing | PLACEHOLDER | Landing shows "8.4 seconds" / "4m 51s" placeholders. Replace with real measured times during TASK-022 (needs a real Stripe OAuth run). |
| 12 | Live checkout with real card | BLOCKED | TASK-060 — user-only, live keys + real card + refund. |
| 13 | Unit tests / typecheck / lint / builds | PASS | Re-run in final verification sweep below. |

Ship gate: items 1–5, 11, 12 must flip to PASS after the user completes `docs/stripe-setup.md` and approves the prod deploy.
