# Validation Report — Stripe Churn Saver Widget ("the easiest cancellation flow on Earth")

_Generated: 2026-07-02_

## Verdict
**Strong**

A real painkiller with a clear buyer, a genuine wedge (time-to-value vs Churnkey's engineering-assisted setup), an honest price gap in the market, and a 14-day behavioral test that is actually runnable. The one risk to keep watching: **live OAuth completion rate** — if founders admire the sandbox but won't connect real Stripe accounts, reshape around earning trust (sandbox-as-product first, write access second).

## Scorecard
| Area | Score | Read |
|---|---:|---|
| Pain intensity | 4/5 | Direct MRR loss felt personally by founders; diluted by low absolute cancel volume at the bottom of the target range |
| Buyer clarity | 4/5 | Founder = user = buyer = installer, findable in named communities; the $5k–50k MRR band still needs field confirmation |
| Urgency | 3/5 | Churn hurts but "fix the cancel flow" is never this week's fire; outreach must manufacture the moment (the cancel-flow screenshot does this) |
| Differentiation | 4/5 | Branded sandbox preview + 5-minute install is a real wedge vs Churnkey; weakest against DIY, not against competitors |
| Speed to validate | 4/5 | Full behavioral test in 14 days after ~2 weeks of build; only the trust question requires live accounts |
| Founder advantage | 3/5 | Dev-tools/infra background fits the security-heavy build and the job-leverage goal; no existing audience or distribution asset yet |

## Core Assumption
Early-stage B2B SaaS founders will grant a third-party widget write access to their live Stripe billing and pay ~$39/mo to deflect cancellations they currently lose instantly.

## Fatal Flaws
| Risk | Severity | Why It Matters | Fast Test |
|---|---|---|---|
| Trust barrier: Stripe write access to live billing from an unknown vendor | High | The core UX ("1-click connect") is also the scariest ask — a bug or breach can pause, discount, or cancel real revenue. Demos get compliments; live OAuth completions are the real gate. | Send 30 custom sandbox links; measure live Stripe Connect OAuth completions. If <3 of 30 connect, the trust barrier is the business. |
| Buyer squeeze: target has too few cancels to feel ROI; those with enough churn buy Churnkey | High | A founder at $3k MRR with 8 cancels/month saves ~$58 for $39 paid — thin. Companies where the math sings have Churnkey budgets and security questionnaires. | Ask each outreach founder their monthly cancel count before pitching. If interested founders cluster below ~15 cancels/month, reprice or move upmarket. |
| DIY is a real competitor: a technical founder can build a cancel-reason modal + coupon in an afternoon | Medium | "Why pay $39/mo forever for something I can hack in a day?" is the most common objection. The wedge is speed + cross-tenant data, not capability. | In every discovery call ask "why haven't you built this yourself?" and position around the honest answer. |

## Problem Reality
- **Pain:** "Someone cancelled last night and I don't even know why — that was $79/mo, gone, no exit survey, no counter-offer." Frequency scales with MRR; each cancel is direct revenue loss plus zero feedback.
- **Early adopter:** Bootstrapped B2B SaaS founder at $5k–50k MRR, Stripe billing, no spare engineering time, active on IndieHackers / r/SaaS / build-in-public X.
- **Vitamin or painkiller:** Painkiller — but low-dose at the bottom of the range. It becomes acute exactly where cancel volume makes the ROI math obvious, which is why the target band matters more than any feature.

## Competition
- **Current behavior:** A bare "Cancel" button that fires immediately; some founders email churned users after the fact or paste in a Typeform exit survey. Most do nothing.
- **Real enemy:** Inertia plus distrust — "my cancel flow is fine for now" and "I'm not giving a stranger's script Stripe write access." Churnkey ($250+/mo), ProsperStack, and Chargebee Retention vacate the $39 tier; DIY lives there instead.
- **Differentiation needed:** (1) Branded sandbox preview — their coupons and logo in a working cancel flow 10 seconds after OAuth, before any code; (2) time-to-live under 5 minutes. "Cheaper Churnkey" is not differentiation; "installed before your coffee cooled" is. Long-term moat: cross-tenant offer-conversion data.

## First 10 Customers
1. **IndieHackers + r/SaaS product mining (days 1–2):** Sign up for 30 founders' products and click their actual cancel flow. Screenshot the bare ones — the screenshot is the opening message. Success = 10 replies agreeing to look at a mockup.
2. **Custom sandbox link + 30-second Loom (days 3–8):** For each replier, build a branded sandbox instance and record a short Loom. Ask for a 15-minute call, not an install. Success = 5 calls booked.
3. **White-glove install on the call (days 8–14):** Do Stripe Connect + script-tag paste live with them; watching them hit the OAuth screen is the trust-barrier data. Charge from day one ($19–29/mo founder rate, 30-day refund) — no free tier. Success = 3 live paying installs.

## MVP
- **Build:** Stripe Connect OAuth → branded sandbox preview → embeddable widget with exactly two deflection actions (pause via `pause_collection`, coupon apply) → idempotent webhook handler → one plain page counting offers shown / accepted / cancels. The sandbox preview is the sales asset, so it stays in scope.
- **Cut:** Analytics dashboard and CSS charts, A/B testing, AI recommendations, npm SDK, test-mode toggle, custom subdomains, deflection rules engine (hardcode one flow), Product Hunt launch until 5 paying customers.
- **2-week test:** 30 personalized sandbox links → measure sandbox opens, live OAuth completions, script installs, paid conversions. Pass = 3+ paying installs. If founders love the sandbox but stall at OAuth, pivot signal: sell the sandbox itself as a paid cancel-flow audit/preview tool first, earn write-access trust second.

## Edits Applied to product-idea.md
- Created `docs/product-idea.md` from this validation run (none existed).
- **Target user** — set to "bootstrapped B2B SaaS founders at $5k–50k MRR on Stripe" (Step 3 finding, recommended default applied).
- **Smallest testable version** — two-deflection-action build, paid from day one with no free tier (Step 5/6 finding; diverges deliberately from idea.md's "free for 5 founders" Week 3 plan).
- **Risky assumptions** — set to the three fatal flaws above.

## Next Step
Run the **Product Planner** skill — its intake will pick up `docs/product-idea.md` from here. (Part of BuilderOS: https://github.com/BuildGreatProducts/builder-os)
