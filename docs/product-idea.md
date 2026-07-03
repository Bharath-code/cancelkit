# Product Idea — Stripe Churn Saver Widget

_Last updated: 2026-07-02 (from validation run)_

## One-liner
The easiest cancellation flow on Earth: a Stripe-connected widget that installs in under 5 minutes and turns "Cancel" clicks into pauses, discounts, and exit feedback.

## Problem
B2B SaaS founders lose subscribers through a bare "Cancel" button that fires instantly — no exit survey, no counter-offer, no feedback. Every cancel is lost MRR plus lost learning. Existing tools (Churnkey $250+/mo, ProsperStack, Chargebee Retention) require engineering-assisted setup and enterprise pricing, so the sub-$50k-MRR tier does nothing at all.

## Target user
Bootstrapped B2B SaaS founder at **$5k–50k MRR**, billing on Stripe, no spare engineering time, active on IndieHackers / r/SaaS / build-in-public X. Founder = user = buyer = installer.

(Narrowed from "early-stage B2B SaaS founders" — below ~$5k MRR cancel volume is too low for the ROI math; above ~$50k they shop enterprise retention tools.)

## Solution
1. **1-click Stripe Connect (OAuth)** — reads their live coupons, plans, and subscriptions; no API-key copying or metadata mapping.
2. **Branded sandbox preview** — 10 seconds after OAuth they see a working cancellation flow using *their* coupons, products, and branding, before installing anything.
3. **Embeddable widget** (<12kb, iframe + postMessage, signed config) with exactly two deflection actions at launch: subscription pause (`pause_collection`) and coupon apply.
4. Idempotent Stripe webhook handling to keep billing state exact.

## Smallest testable version
Two-week build: Stripe Connect OAuth → branded sandbox preview → widget with pause + coupon actions → webhook handler → a single plain page counting offers shown / accepted / cancels. One hardcoded flow (reason → offer → resolve), no rules engine.

Then a 14-day behavioral test: 30 personalized sandbox links to founders whose bare cancel flows were verified by hand; measure sandbox opens → **live OAuth completions** → script installs → paid conversions. Pass = 3+ paying installs at $19–29/mo founder rate. **Paid from day one — no free tier.**

## Pricing
Founder rate $19–29/mo during validation; $39 / $99 / $249 tiers once ROI data exists (one saved $99 subscription pays for the tool).

## Risky assumptions
1. **Trust:** founders will grant a third-party widget from an unknown solo developer OAuth *write* access to live Stripe billing. (The kill-shot assumption — measured by live OAuth completion rate.)
2. **Buyer band:** founders in the $5k–50k MRR band have enough monthly cancel volume (~15+) to feel obvious ROI at $39/mo.
3. **DIY resistance:** technical founders will pay recurring money for something they could hack together in an afternoon, because time-to-value + cross-tenant offer data beats DIY.

## Fallback / pivot direction
If founders love the sandbox but stall at live OAuth: sell the **sandbox itself** as a paid cancel-flow preview/audit tool first, and earn write-access trust as step two.

## Long-term strategy (moat sequence)

Day one there is no moat — the widget is copyable. Time-to-value is the **wedge**, not the moat. Moats accumulate in this order:

1. **Data moat (months 6–24):** log every session event (cancel reason → offer shown → outcome) from day one. After ~200 customers, ship offer recommendations trained on cross-tenant outcomes ("'too expensive' on annual plans accepts a pause 41% of the time"). Unreplicable without the customer base. The MVP's session schema is this moat under construction.
2. **Switching-cost moat (months 12–36):** expand from widget to system of record — historical churn-reason data, win-back emails, dunning/failed-payment recovery. Nobody rips out the tool that recovered $3k last quarter and holds two years of exit-survey history.
3. **Distribution moat (months 12+):** Stripe App Marketplace, quarterly "State of SaaS Churn" report from the proprietary dataset (ProfitWell benchmark playbook), programmatic SEO on "Churnkey alternative" / "Stripe cancel flow" queries.
4. **Brand moat (years 2+):** become the default answer to "cancel flow" in IndieHackers / r/SaaS threads — earned via 1–3, not ad spend.

**10x value proposition (say these numbers everywhere):** live in 5 minutes vs weeks (10x setup), $39 vs $250 (6x price), zero engineering vs an integration project. Pays for itself with one saved customer.

**Delight mechanics to build early:**
- *Pre-purchase holy-sh*t moment:* OAuth → 10 seconds → their logo, coupons, and plans in a working cancel flow. Protect this; anything that delays or clutters it is a mistake.
- *Post-purchase:* real-time "You just saved a customer" email with name + dollar amount (retains better than any dashboard; gets screenshotted to Twitter).
- *Monthly:* saved-revenue receipt ("6 saves, $312 MRR retained — 8x what you paid us"). Later: benchmark deltas from the cross-tenant data.

**North-star friction metric:** time from landing page to live widget. Stopwatch it, publish it, drive it down forever.

**Product → company transitions:** founder-installed → 80%+ self-serve activation; outbound DMs → SEO + marketplace + partner channels; white-glove call transcripts → deleted friction points; first hires from revenue at ~$15–20k MRR (support/success, then content/SEO). Price ladder toward $1M ARR: $39 self-serve top-of-funnel → $199 Growth / $499 Scale tiers for $50k–500k MRR SaaS (requires SOC 2 posture, A/B testing, team seats) → dunning priced by customer MRR.

## Secondary goal
The repo doubles as job-leverage portfolio material (secure embeddable SDK: OAuth, CSP, cross-origin iframes, JWT-signed config, idempotent webhooks) — see idea.md for the interview-positioning notes.

## Candidates considered
Not applicable — direct validation run.
