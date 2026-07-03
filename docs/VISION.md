# Vision — CancelKit

> Captured by the Product Planner skill. This file is the source of truth for
> generating product-vision.md, prd.md, and product-roadmap.md. Edit it directly
> and re-run the Product Planner to regenerate downstream documents.

**Created:** 2026-07-02
**Updated:** 2026-07-02

## Founder

- **Name:** Bharath Kumar
- **Expertise:** Software engineering with a dev-tools/infrastructure background — comfortable with OAuth, webhooks, cross-origin embeds, and security-heavy builds
- **Background:** I build developer tooling and infrastructure, and I've watched bootstrapped SaaS founders lose paying customers through a bare "Cancel" button that fires instantly — no exit survey, no counter-offer, no learning. The enterprise tools that fix this (Churnkey at $250+/mo) are out of reach for the sub-$50k-MRR tier, and my background fits the security-sensitive build exactly. The repo also doubles as portfolio proof of secure embeddable-SDK work (OAuth, CSP, cross-origin iframes, signed config, idempotent webhooks). _(Drafted from idea.md and the validation run — edit freely.)_

## Purpose

- **Who you help:** Bootstrapped B2B SaaS founders at $5k–50k MRR, billing on Stripe, with no spare engineering time — active on IndieHackers, r/SaaS, and build-in-public X. Founder = user = buyer = installer.
- **Problem you solve:** Their cancel button fires instantly. Every cancellation is lost MRR plus zero feedback — no exit reason, no pause offer, no discount counter. Existing retention tools (Churnkey $250+/mo, ProsperStack, Chargebee Retention) require engineering-assisted setup and enterprise pricing, so this tier does nothing at all.
- **Desired transformation:** Before: "Someone cancelled last night and I don't even know why — that was $79/mo, gone." After: every cancel click becomes a pause, a discount acceptance, or at minimum a logged exit reason — with a real-time "You just saved a customer" email and a monthly saved-revenue receipt proving the ROI.
- **Why you:** Dev-tools/infra engineer whose strengths (OAuth flows, webhook idempotency, secure cross-origin embeds) are exactly the hard parts of this product — and exactly what makes founders trust a third-party widget with Stripe write access. Full-time and bootstrapped, so time-to-value discipline is survival, not a slogan.

## Product

- **Name:** CancelKit
- **One-liner:** The easiest cancellation flow on Earth: a Stripe-connected widget that installs in under 5 minutes and turns "Cancel" clicks into pauses, discounts, and exit feedback.
- **How it works:** A founder clicks "Connect Stripe" (1-click OAuth). Ten seconds later they see a branded sandbox preview — a working cancellation flow using their own coupons, plans, and logo — before installing anything. They paste one script tag; the embeddable widget (<12kb, iframe + postMessage, signed config) intercepts cancel clicks, asks the exit reason, and offers a subscription pause (`pause_collection`) or a coupon. Idempotent webhook handling keeps billing state exact. A plain stats page counts offers shown / accepted / cancels.
- **Key capabilities:**
  - 1-click Stripe Connect OAuth — no API-key copying or metadata mapping
  - Branded sandbox preview 10 seconds after OAuth, before any code install
  - Embeddable cancel-flow widget with two deflection actions at launch: pause and coupon apply
  - Idempotent Stripe webhook handling for exact billing state
  - Save-event tracking: offers shown / accepted / cancels, plus "You just saved a customer" emails
- **Platform:** web
- **Market differentiation:** Unlike Churnkey/ProsperStack (enterprise pricing, engineering-assisted setup), CancelKit is live in 5 minutes vs weeks (10x setup), $39 vs $250 (6x price), and zero engineering. "Installed before your coffee cooled," not "cheaper Churnkey." Long-term moat: cross-tenant offer-conversion data (reason → offer → outcome), then switching costs (churn-reason history, win-back, dunning), then Stripe Marketplace + benchmark-report distribution.
- **Magic moment:** OAuth → 10 seconds → their logo, their coupons, and their plans in a working cancel flow, before installing anything. Protect this; anything that delays or clutters it is a mistake.

## Audience

- **Primary user:** Bootstrapped B2B SaaS founder at $5k–50k MRR on Stripe. Wears every hat, has no spare engineering time, feels each cancellation personally as lost MRR, and hangs out on IndieHackers / r/SaaS / build-in-public X. Needs ~15+ cancels/month for the $39/mo ROI math to feel obvious.
- **Secondary users:**
  - End subscribers — the founder's own customers who interact with the widget when they try to cancel; they never buy CancelKit but their experience is the product
  - Co-founder / marketer — reviews exit-survey feedback and save stats; often champions the purchase
  - Agencies & consultants — manage multiple SaaS clients and could install CancelKit across accounts (future channel)
- **Current alternatives:** A bare "Cancel" button that fires immediately; emailing churned users after the fact; a pasted-in Typeform exit survey; Churnkey/ProsperStack/Chargebee Retention for those with budget; DIY (a technical founder can hack a cancel-reason modal + coupon in an afternoon); most commonly — nothing.
- **Frustrations:** Enterprise tools cost $250+/mo and need engineering-assisted onboarding; DIY takes an afternoon that never comes and produces no cross-tenant learning; doing nothing means every cancel is silent lost revenue. The real enemy is inertia plus distrust ("my cancel flow is fine" / "I'm not giving a stranger's script Stripe write access").

## Business

- **Revenue model:** subscription
- **90-day goal:** 10 paying customers at the founder rate (~$250 MRR), the "landing page → live widget" time published on the site, and first documented save stories. (Gate: the 14-day behavioral test passes first — 3+ paying installs at $19–29/mo, paid from day one, no free tier.)
- **6-month vision:** ~75 customers and ~$3k MRR with 80%+ self-serve activation, $39/$99 tiers live, the session-event dataset accumulating toward the data moat, and the first "State of SaaS Churn" content shipped.
- **Constraints:** Full-time solo, bootstrapped — 40+ hrs/week on personal runway, no external funding. Minimal cash budget, so free tiers and low-ops infrastructure. Biggest non-technical gap: no existing audience or distribution asset yet.
- **Go-to-market:** Product mining on IndieHackers/r/SaaS — sign up for 30 founders' products, screenshot their bare cancel flows, and open with the screenshot. Personalized sandbox links + 30-second Looms, then white-glove installs on 15-minute calls (the OAuth screen moment is the trust-barrier data). Charge from day one. Later: Stripe App Marketplace, programmatic SEO ("Churnkey alternative", "Stripe cancel flow"), and the quarterly benchmark report from proprietary data.

## Brand Voice

- **Personality:** Sharp operator — direct, numbers-first, zero fluff. The tool that respects a founder's time because it was built by someone who counts minutes too. Confident about security without being boastful.
- **Tone of voice:** Every claim is a number or a mechanism, never an adjective. Landing page: "Live in 5 minutes. $39/mo. One saved customer pays for the year." Save email: "You just saved Sarah K. — $99/mo retained." Error state: "Stripe rejected the coupon (expired 06/12). Pick another — your subscriber is still on the page." Security copy is precise, not reassuring-vague: "Scoped OAuth. Signed widget config. Idempotent webhooks."

> Visual identity (mood, anti-patterns, design tokens) is deliberately not
> captured here — it lives in docs/design.md, generated by the Design System
> skill from image references.

## Tech Stack

- **App type:** web
- **Frontend:** Next.js — dashboard, landing page, sandbox preview, and OAuth callback in one deployable app; largest ecosystem and best coding-agent support. The widget itself is a separate vanilla-TS bundle (<12kb, iframe + postMessage) with no framework inside.
- **Backend:** Convex — TypeScript end-to-end, zero backend boilerplate, real-time reactivity (live stats page updates as saves happen). Stripe webhooks land on a Convex HTTP action.
- **Database:** Convex Database — included with the backend; ACID transactions, with webhook idempotency enforced via an indexed `stripe_event_id` uniqueness check. The session-events table (reason → offer → outcome) is the data moat under construction from day one.
- **Auth:** Stripe Connect as identity — the OAuth founders already complete to onboard IS the sign-in; zero extra signup step, protecting the 10-second magic moment. Dashboard sessions via signed cookie keyed to the connected Stripe account.
- **Payments:** Stripe Billing — already deep in the Stripe API, and CancelKit dogfoods its own widget on its own cancel flow (which is also a marketing story).
- **Analytics:** PostHog — free tier covers validation; funnel from sandbox open → live OAuth completion → script install → paid conversion is the core validation instrument.
- **Email:** Resend — transactional email; the real-time "You just saved a customer" email and monthly saved-revenue receipt are core delight mechanics, not nice-to-haves.
- **Error tracking:** Sentry — a buggy widget touching live billing is an existential risk; catch crashes before founders (or their subscribers) report them.

## Tooling

- **Coding agent:** Claude Code
