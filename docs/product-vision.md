# Product Vision — CancelKit

## 1. Vision & Mission

### Vision Statement

Every bootstrapped SaaS keeps the customers it could have kept — no subscription ends without a reason captured, an offer made, and a lesson learned.

### Mission Statement

CancelKit turns the bare "Cancel" button into a retention flow that any Stripe-billing founder can install in under five minutes, with no engineering time and no enterprise contract.

### Founder's Why

Bharath builds developer tooling and infrastructure for a living, which means he spends his days on exactly the things this product is made of: OAuth flows, webhook reliability, cross-origin embeds, and the security posture that makes a third party safe to trust with billing access. He has watched bootstrapped founders lose paying customers through a cancel button that fires instantly — no exit survey, no counter-offer, no learning — while the tools that fix this (Churnkey at $250+/mo, ProsperStack, Chargebee Retention) sit behind enterprise pricing and engineering-assisted onboarding that the sub-$50k-MRR tier cannot justify.

The gap is not capability — a technical founder can hack a cancel-reason modal in an afternoon. The gap is that the afternoon never comes, and the DIY version never learns from anyone else's cancellations. Bharath's founder-market fit is precise: the hardest parts of this product (earning Stripe write-access trust from strangers, keeping billing state exact through idempotent webhooks, shipping a widget small and safe enough to paste into someone else's product) are the parts he already knows how to build.

There is an honest secondary motive, and it is a strength, not a distraction: the repo doubles as portfolio proof of secure embeddable-SDK work. That means the security engineering will be over-delivered rather than corner-cut — which happens to be exactly what the trust barrier demands.

### Core Values

**Protect the ten seconds.** The magic moment — OAuth to branded working preview in ten seconds — is the product's entire sales motion. Any feature, form field, or loading state that delays or clutters it gets cut, no matter how reasonable it seems. When two designs conflict, the one that keeps the preview instant wins.

**Every claim is a number.** No "seamless," no "powerful." The landing page says "Live in 5 minutes." The monthly email says "6 saves, $312 MRR retained — 8x what you paid us." If a claim can't be stated as a number or a mechanism, it doesn't ship. This is also the internal standard: measure the landing-page-to-live-widget time with a stopwatch, publish it, and drive it down forever.

**Billing state is sacred.** CancelKit touches live revenue. Every Stripe mutation is idempotent, every webhook is verified and deduplicated, and any ambiguity resolves in favor of not touching the subscription. A missed save is recoverable; a corrupted billing state is a churned customer and a public trust failure.

**Log everything from day one.** Every session event — reason given, offer shown, outcome — goes into the dataset even when there are three customers. The cross-tenant offer-conversion data is the eventual moat, and it only exists if the schema is right from the first install.

**Charge from day one.** No free tier, no pilot deals. $19–29/mo founder rate during validation. Willingness to pay is the validation signal; a free tier would destroy the one measurement that matters.

### Strategic Pillars

1. **Time-to-value is the wedge, data is the moat.** Win installs on "live before your coffee cooled"; win retention (of CancelKit's own customers) on cross-tenant learning nobody can replicate without the customer base. Never confuse the two — speed is copyable, the dataset is not.
2. **Trust is the product.** The scariest ask in the funnel is granting Stripe write access to an unknown solo developer. Every public artifact — security page, scoped permissions, precise copy, the portfolio-grade codebase — exists to lower that barrier. When in doubt, over-invest in visible security.
3. **Founder = user = buyer = installer.** One persona makes every decision. No admin roles, no team features, no procurement flows in v1. If a feature serves anyone other than the solo founder installing it themselves, it waits.
4. **Sell with the product, not about it.** The branded sandbox preview is the pitch deck. Outreach leads with a screenshot of the prospect's own bare cancel flow and a personalized sandbox link — never a feature list.

### Success Looks Like

Twelve months in: roughly 150 paying customers around $4–5k MRR, 80%+ of new customers activating fully self-serve, and the published install time sitting under five minutes on the landing page. The $39/$99 tiers are live and the first $99 customers arrived without a sales call. The session-event dataset has crossed the threshold (~200 customers' worth of cancel sessions) where offer recommendations become credible, and the first "State of SaaS Churn" report has been mined from it and cited in IndieHackers threads. The Stripe App Marketplace listing is approved and producing installs. Bharath answers "why haven't you built this yourself?" in discovery calls with a straight face, because the answer — "you could, but it won't know that 'too expensive' on annual plans accepts a pause 41% of the time" — is now true. And at least once a week, a founder screenshots their "You just saved a customer" email to Twitter.

## 2. User Research

### Primary Persona

**Dev, 33, solo founder of a B2B SaaS at $18k MRR, billing on Stripe.** Ships from a home office; the product is 4 years of nights-and-weekends that went full-time 18 months ago. Around 220 subscribers between $49 and $199/mo, losing 10–20 a month. Extremely technically capable — could build a cancel-flow modal himself, which is exactly why he hasn't bought Churnkey and exactly the objection CancelKit must survive. His day is support tickets before breakfast, feature work until evening, and marketing he keeps postponing. He reads IndieHackers and r/SaaS, posts MRR screenshots on X, and feels every cancellation personally — the Stripe email lands at 2am and he checks his phone anyway.

What he currently does about churn: nothing structured. Sometimes he emails a churned customer a week later ("mind sharing why?"); reply rate is dismal. He knows he should fix the cancel flow. It has never once been this week's fire.

Tech comfort: expert. Emotional state: quiet, recurring frustration — churn is the leak he cannot see into. What makes him switch: proof of ROI in his own numbers within minutes, not a demo call. What makes him bounce: any signup form before he sees value, any hint the vendor might break his billing, any price that assumes a Series A.

### Secondary Personas

**The end subscriber (Sarah, a customer of Dev's product).** She clicks Cancel because the price stopped feeling justified this quarter. She never chooses CancelKit and never sees the name, but she is the person the widget must respect: fast, honest, no dark patterns, cancel still one click away if she insists. Her experience *is* the product — a manipulative flow costs Dev brand damage and costs CancelKit its reputation.

**The co-founder / marketer (Priya).** At two-person SaaS companies, she owns retention numbers and reads the exit-survey feed. She may be the one who champions the purchase after seeing a competitor's save email screenshot on X. She needs the stats page to be legible to a non-engineer.

**The agency consultant (Marco).** Runs growth for four SaaS clients. If CancelKit works for one client, he installs it for the others — a future multi-account channel, deliberately not built for in v1 but worth not designing against (nothing in the data model should assume one human = one Stripe account forever).

### Jobs To Be Done

**Functional:** When a subscriber clicks Cancel, intercept the moment and offer a pause or discount before the cancellation fires, so lost MRR gets a last chance. Capture the exit reason on every cancellation, successful or not, so churn stops being silent. Keep Stripe as the single source of truth — no reconciliation work, ever.

**Emotional:** Stop dreading the 2am Stripe cancellation email; replace it with the occasional "you just saved a customer" hit of dopamine. Feel like churn is a system with a dial, not weather.

**Social:** Look sharp in build-in-public circles — the saved-revenue receipt is a flex ("8x what you paid us") and the screenshot writes itself. Be the founder who runs a tight retention operation without hiring for it.

### Pain Points

1. **Silent revenue loss (severe, 10–20x/month for the target band).** Every cancel is direct MRR gone plus zero feedback. Current response: nothing, or a too-late email. Consequence: compounding churn that caps growth — at 7% monthly churn, the leak eventually equals new sales.
2. **No exit data (severe, every cancellation).** Founders make roadmap and pricing decisions blind to why people actually leave. Current response: guessing, or a Typeform nobody completes. Consequence: fixing the wrong things.
3. **Retention tooling is priced and shaped for enterprise (blocking, at purchase time).** Churnkey at $250+/mo with engineering-assisted onboarding is a non-starter at $18k MRR. Current response: do nothing, or a DIY afternoon that never comes. Consequence: the entire tier goes unserved.
4. **No time to build it themselves (moderate but chronic).** The DIY modal is an afternoon of work plus ongoing maintenance plus webhook edge cases. It loses to feature work every single week. This pain is real but self-inflicted enough that positioning must respect it, not mock it.

### Current Alternatives & Competitive Landscape

**Do nothing (the market leader).** A bare Cancel button that fires immediately. Does well: zero cost, zero risk, zero effort. Falls short: every cancel is unmitigated loss. Switching requires: believing the fix takes five minutes, not a sprint — which is precisely the claim CancelKit must prove in the sandbox.

**DIY modal + coupon.** A technical founder's afternoon project. Does well: free, fully controlled, no third-party risk. Falls short: never gets built; when built, never maintained; learns nothing from other companies' cancel sessions; webhook edge cases (pause vs. cancel-at-period-end vs. proration) eat the time saved. Switching requires: honesty about opportunity cost. This is the most dangerous competitor because the buyer *is* the builder.

**Churnkey / ProsperStack / Chargebee Retention.** Enterprise cancel-flow suites. Do well: mature feature sets, A/B testing, dunning, proven at scale. Fall short for this audience: $250+/mo, sales-assisted onboarding, engineering integration work, security questionnaires — all rational for $100k+ MRR companies and absurd below $50k. Switching (from them, later): CancelKit should expect to *lose* customers upward to them at scale, and win the band they structurally cannot serve profitably.

**Typeform/email exit surveys.** Do well: cheap, capture some reasons. Fall short: fire after the decision is final, no deflection, single-digit response rates. Switching requires: nothing — CancelKit strictly dominates this.

### Key Assumptions to Validate

1. **We assume founders will grant Stripe write access to an unknown solo developer's widget** because the sandbox preview builds enough trust. To validate: 30 personalized sandbox links; measure live OAuth completions. This is the kill-shot assumption — under 3 of 30 means the trust barrier is the business, and the pivot is selling the sandbox as a read-only audit tool first.
2. **We assume the $5k–50k MRR band has enough cancel volume (~15+/month) to feel ROI at $39/mo.** To validate: ask every outreach founder their monthly cancel count before pitching; if interested founders cluster below ~15, reprice or move the band up.
3. **We assume technical founders will pay recurring money for something they could build**, because time-to-value plus cross-tenant data beats DIY. To validate: ask "why haven't you built this yourself?" in every discovery call and position around the honest answers.
4. **We assume pause and coupon are the right two deflection actions** (not plan downgrade, not concierge outreach). To validate: exit-reason data from the first installs; if reasons cluster around something neither action addresses, the offer set is wrong.
5. **We assume subscribers won't perceive the flow as a dark pattern** and founders won't fear brand damage. To validate: watch completion rates and rage-quits in session events; keep "cancel anyway" one click away and measure whether founders ask to bury it (refuse if they do).
6. **We assume the widget can stay under 12kb and inside an iframe without breaking on real-world sites** (CSP rules, cookie policies, SPA routers). To validate: install on 5 structurally different sites during white-glove calls before claiming "works everywhere."
7. **We assume white-glove install transcripts will reveal friction that can be deleted toward 80% self-serve activation.** To validate: record every install call; each friction point becomes a backlog item; track activation rate monthly.
8. **We assume outreach-led GTM can produce the first 10 customers without an existing audience.** To validate: the screenshot-opener campaign itself — reply rate on 30 personalized messages is the test.

### User Journey Map

**Awareness.** Dev gets a DM: a screenshot of *his own* cancel flow — the bare button — with one line: "This fires instantly. Want to see what it could do instead? Here's your product with a working save flow: [link]." Emotion: mild defensiveness, strong curiosity. Friction: none yet — the link requires nothing.

**Consideration.** He opens the sandbox: his logo, his actual plan names, a working reason-→-offer flow. Ten seconds of "wait, how does it know my coupons?" (Answer visible on the page: it doesn't yet — this one's mocked from public info; connect Stripe and it's real.) Emotion: the hook lands. Friction point one: the Loom and pricing must answer "who are you and why would I trust you" before he closes the tab — the security page and 10x numbers live here.

**First use.** He clicks Connect Stripe. This is the cliff: the OAuth consent screen names the permissions. Emotion: suspicion peaks. Everything about the page around it — scoped permissions listed plainly, what CancelKit will never do, the idempotency guarantee — exists for this moment. He completes OAuth; ten seconds later the preview is rebuilt from his *live* coupons and plans.

**Magic moment.** His real product, his real offers, in a working cancel flow he didn't build. He pastes one script tag, flips it live, and cancels a test subscription himself to watch the flow catch it. Elapsed time since the DM: under fifteen minutes. Emotion: "that was suspiciously easy" — say it in the copy before he does.

**Habit formation.** He doesn't visit the dashboard daily — correctly; there's little to do there. The product lives in his inbox: real-time "You just saved Sarah K. — $99/mo retained" emails and the monthly saved-revenue receipt ("6 saves, $312 MRR retained — 8x what you paid us"). Emotion: the 2am dread email has a counterweight. Friction to watch: months with zero saves must still prove value via exit-reason insights, or he churns.

**Advocacy.** He screenshots the save email to X. The reply guys ask what tool. The loop closes with zero ad spend — which is the entire distribution model until the marketplace and SEO layers exist.

## 3. Product Strategy

### Product Principles

1. **Nothing before the preview.** No account creation, no email capture, no pricing wall between a visitor and the sandbox. The funnel is preview → OAuth → install → pay; every reordering of that sequence has to argue against measured conversion data.
2. **Two offers, done perfectly.** Pause (`pause_collection`) and coupon apply — nothing else at launch. A rules engine, A/B tests, and AI offer selection are all worse than two actions that never corrupt billing state.
3. **The widget is a guest.** Under 12kb, sandboxed in an iframe, communicating by postMessage with signed config, no cookies on the host domain, no style leakage. It must be impossible for CancelKit to break or degrade a customer's product.
4. **No dark patterns, structurally.** "Cancel anyway" is always visible and always one click. This is a moral position that is also a moat: founders' brand-damage fear is a purchase objection, and being the demonstrably honest cancel flow neutralizes it.
5. **The dataset is a product decision, not an analytics afterthought.** Session events are written to a schema designed for future cross-tenant recommendation queries, from customer #1.
6. **Instrument the funnel before optimizing anything.** Sandbox opens, OAuth completions, installs, and paid conversions are the four numbers the business runs on; they are wired into PostHog before launch, not after.

### Market Differentiation

The retention-tooling market has organized itself around companies that can afford integration projects: Churnkey, ProsperStack, and Chargebee Retention all assume an engineering team, a sales conversation, and $250+/month. Below $50k MRR, that leaves a vacuum filled by nothing — literally a bare button wired straight to `subscription.cancel`.

CancelKit's differentiation is not "cheaper Churnkey," which would be a losing race toward feature parity. It is a different shape of product: **installed before your coffee cooled.** Live in 5 minutes vs. weeks (10x on setup), $39 vs. $250 (6x on price), zero engineering vs. an integration project. The branded sandbox preview inverts the sales motion — instead of describing the product, it shows the founder their own product already saved.

Why it matters to this user: the target founder's scarcest resource is attention, and the alternative isn't Churnkey — it's doing nothing. A tool that requires a sprint loses to nothing; a tool that requires five minutes beats nothing.

Why it's defensible: on day one, honestly, it isn't — the widget is copyable. Speed is the wedge. Defensibility accrues in sequence: the cross-tenant session dataset (which offer converts for which exit reason, unreplicable without the customer base), then switching costs (years of exit-survey history, recovered-revenue records), then distribution (Stripe App Marketplace, the benchmark report, "Churnkey alternative" SEO), then brand (the default answer in IndieHackers threads). The strategy is to move along that sequence faster than a copycat can assemble a customer base.

### Magic Moment Design

The magic moment: **OAuth completes, and ten seconds later the founder sees their own logo, coupons, and plans inside a working cancellation flow — before installing anything.**

For this to happen reliably, four things must be true. First, the OAuth callback must immediately fetch products, prices, coupons, and branding (Stripe's `account` object carries logo and brand color) and render the preview from live data with no manual mapping step — any "now configure your offers" screen before the preview kills it. Second, the preview must be a *working* flow, not a screenshot — the founder clicks through reason → offer → resolution against sandboxed state. Third, defaults must be smart: pre-select a sensible pause length (e.g. 30 days) and the founder's best existing coupon, so zero configuration produces a credible flow. Fourth, the whole fetch-and-render path must be fast and instrumented — if p95 exceeds ~10 seconds, that's a build blocker, not a backlog item.

Shortest path from first touch: landing page → "Connect Stripe" → OAuth → preview. No signup form exists as a separate step; the OAuth *is* the signup (Stripe Connect as identity). The MVP as scoped achieves the moment fully — the pre-OAuth mocked sandbox (built from public info for outreach links) is the one piece that extends it and is worth its scope because it *is* the outreach asset.

### MVP Definition

Buildable in roughly 4–6 weeks by a solo full-time founder with a coding agent:

1. **Stripe Connect OAuth onboarding.** One click, scoped permissions, account record created on callback. Essential: it is both the signup and the trust gate. Done: a founder with no prior contact completes OAuth and lands in a live preview in under 10 seconds.
2. **Branded sandbox preview.** Working reason → offer → resolve flow rendered from the connected account's real coupons, plans, and branding; sandboxed (no live mutations). Essential: this is the magic moment and the sales asset. Done: preview renders from live account data with zero configuration; personalized pre-OAuth mock versions can be generated for outreach.
3. **Embeddable widget.** <12kb vanilla-TS bundle, iframe + postMessage, JWT-signed config, one hardcoded flow: reason select → matched offer (pause or coupon) → resolve or cancel anyway. Essential: it is the product. Done: pasted script tag intercepts the customer's cancel button, runs the flow on a real subscription, and never breaks the host page.
4. **Two deflection actions.** Pause via `pause_collection` (resume date set) and coupon apply, executed against live Stripe with verification. Essential: the save is the value. Done: both actions produce exact, verified Stripe state; "cancel anyway" completes the cancellation properly.
5. **Idempotent webhook handling.** Signature-verified, event-ID-deduplicated processing of subscription lifecycle events to keep local state exact. Essential: billing correctness is the trust promise. Done: replayed and out-of-order events produce no duplicate or incorrect state.
6. **Single stats page + save emails.** One page counting offers shown / accepted / cancels, plus the real-time "You just saved a customer" email (Resend) with name and dollar amount. Essential: proof of ROI is the retention mechanism for CancelKit's own customers. Done: stats update in real time (Convex reactivity); the save email fires within a minute of a save.
7. **CancelKit's own billing.** Stripe Billing subscription at the founder rate, dogfooding the widget on its own cancel flow. Essential: charging from day one is the validation instrument. Done: a founder can pay, and canceling CancelKit runs CancelKit.

### Explicitly Out of Scope

- **Analytics dashboard with charts.** Tempting because founders love graphs; deferred because one plain counting page answers the only question that matters at this stage ("is it saving anyone?"). Reconsider after ~25 customers ask for trends.
- **Deflection rules engine.** Tempting because "configurable" feels like product depth; deferred because one hardcoded flow is faster to trust and to test. The session data will reveal what rules are worth having. Reconsider alongside the $99 tier (~month 4–6).
- **A/B testing of offers.** Requires traffic volume no single customer has; the cross-tenant dataset is the better path to the same answer. Reconsider post-200 customers as a data-moat feature.
- **AI offer recommendations.** The moat endgame, not the MVP. Needs ~200 customers of session data to be credible. Reconsider at month 6–12; the schema supports it from day one.
- **npm SDK / React components.** Tempting for DX credibility; deferred because the script tag serves the "zero engineering" promise better. Reconsider when self-serve customers ask, likely alongside marketplace listing.
- **Test-mode toggle, custom subdomains, team seats, SOC 2.** All belong to the $99/$249 upmarket motion (months 6+), not validation.
- **Dunning / failed-payment recovery and win-back emails.** The switching-cost moat expansion — genuinely adjacent, genuinely large, and a guaranteed scope explosion if touched now. Reconsider at ~$3k MRR.
- **Product Hunt launch.** Deferred until 5+ paying customers exist so the launch has proof instead of promises.

### Feature Priority (MoSCoW)

**Must Have:** Stripe Connect OAuth; branded live-data sandbox preview; embeddable widget (iframe, signed config, <12kb); pause + coupon actions; "cancel anyway" path that always works; idempotent webhooks; session-event logging (reason → offer → outcome); plain stats page; save email; Stripe Billing for CancelKit itself; security page with scoped-permission explanation; Sentry on widget and backend.

**Should Have:** Pre-OAuth mocked sandbox generator for outreach links; PostHog funnel instrumentation (sandbox → OAuth → install → paid); monthly saved-revenue receipt email; install-verification check ("we detected the widget on your site").

**Could Have:** Exit-reason word cloud on the stats page; Slack notification option for saves; a second pause-length option; widget theming beyond auto-pulled branding.

**Won't Have (this time):** Rules engine, A/B testing, AI recommendations, dashboard charts, npm SDK, dunning, win-back, team seats, SOC 2, marketplace listing, Product Hunt.

### Core User Flows

**Flow 1 — Onboard (landing → live preview).** Trigger: founder clicks a sandbox link or the landing-page CTA. Steps: (1) landing page states the numbers and the security posture; (2) "Connect Stripe" → Stripe OAuth consent (scoped permissions visible); (3) callback fetches products/prices/coupons/branding; (4) preview renders — founder clicks through reason → offer → resolve in sandbox mode. Outcome: an account exists and the founder has experienced the magic moment. Success criteria: OAuth completion → preview render p95 under 10 seconds; no configuration required before the preview.

**Flow 2 — Install (preview → live widget).** Trigger: founder clicks "Install" from the preview. Steps: (1) copy one script tag with account-signed config; (2) paste into their app near the existing cancel control; (3) CancelKit detects the widget heartbeat and flips status to live; (4) founder runs a test cancel to watch it intercept. Outcome: real cancel clicks now route through the flow. Success criteria: landing-page-to-live time under 5 minutes (stopwatch-measured, published); widget adds <50ms to host page load; zero host-page breakage.

**Flow 3 — Save (subscriber clicks cancel).** Trigger: end subscriber clicks the founder's cancel button. Steps: (1) widget opens in iframe, asks the exit reason; (2) matched offer appears — pause with resume date, or coupon with exact new price; (3) subscriber accepts (Stripe mutation executes, verified) or clicks the always-visible "cancel anyway" (cancellation proceeds correctly); (4) session event logged either way; (5) on a save, the founder's email fires with name and amount. Outcome: a pause, a discount acceptance, or a clean cancellation with a captured reason. Success criteria: end-to-end flow under 30 seconds for the subscriber; 100% of sessions produce a logged event; zero billing-state errors, ever.

### Success Metrics

**Primary metric: live Stripe OAuth completions** — the trust barrier is the business risk, so trust conversions are the number that matters most. From 30 outreach sandbox links: good = 3+ (validation passes), great = 8+.

**Secondary metrics.** Paying customers at day 90: good = 10 (~$250 MRR at founder rate), great = 25 (~$1k MRR). Landing-page-to-live-widget time: good = under 10 minutes, great = under 5 (published either way). Save rate (offers accepted / cancel sessions): good = 15%, great = 30% — this is also each customer's ROI proof. Self-serve activation share by month 6: good = 60%, great = 80%+. CancelKit's own monthly churn: good = under 7%, great = under 4%.

**Leading indicators.** Outreach reply rate on screenshot openers (good = 33%, i.e. 10 of 30). Sandbox open → OAuth click-through (good = 25%). White-glove call → paid conversion (good = 60%). Cancel volume of interested founders (watch: if it clusters under 15/month, the ICP band or the price is wrong — assumption #2 fires).

### Risks

1. **Trust barrier kills the funnel (likelihood: medium-high; impact: existential).** Founders admire the sandbox, refuse live OAuth. Mitigation: security page with scoped permissions in plain language, portfolio-grade public repo hygiene, white-glove installs to witness objections firsthand; prepared pivot — sell the read-only sandbox as a paid cancel-flow audit and earn write access as step two.
2. **Buyer-band squeeze (medium; high).** Founders with enough cancels to feel ROI have Churnkey budgets; those without churn out of CancelKit. Mitigation: ask cancel volume before pitching; be willing to move the band and price up; the $39 price must map to ~1 saved customer/month at typical price points.
3. **DIY objection wins (medium; high).** "I'll build it this weekend." Mitigation: never argue capability — sell the maintained webhook edge cases, the five minutes, and (later) the cross-tenant data; track the objection's frequency in call notes as a positioning input.
4. **A billing bug in the wild (low-to-medium; catastrophic).** One wrongly paused or canceled subscription, publicized, ends the trust story. Mitigation: idempotency everywhere, verification reads after every mutation, Sentry alerting, a kill switch per account that reverts customers to their native cancel behavior instantly.
5. **Stripe platform risk (low; high).** API changes, Connect policy changes, or Stripe shipping a native cancel-flow feature. Mitigation: none real for the last case except speed and data accumulated; for the first two, marketplace participation keeps CancelKit inside Stripe's ecosystem rather than adjacent to it.
6. **Widget breakage on real sites (medium; medium).** CSP rules, SPA routers, cookie policies. Mitigation: iframe-first architecture minimizes surface; test on 5 structurally different sites during white-glove phase; Sentry on the widget itself.
7. **Distribution never compounds (medium; high).** Outreach works but doesn't scale, and no audience exists. Mitigation: the save-email screenshot loop is designed-in virality; marketplace and programmatic SEO are sequenced at months 3–6; every white-glove call doubles as a testimonial ask.
8. **Solo-founder execution risk (medium; medium).** Full-time but bootstrapped; runway pressure invites scope creep toward invoiceable custom work. Mitigation: the two-week build scope and 14-day test are pre-committed; the roadmap is the contract with himself.

## 4. Brand Strategy

### Positioning Statement

For bootstrapped B2B SaaS founders at $5k–50k MRR on Stripe who lose customers through a cancel button that fires instantly, **CancelKit** is the cancellation-flow widget that goes live in under five minutes and turns cancel clicks into pauses, discounts, and exit feedback. Unlike Churnkey and other enterprise retention suites that cost $250+/month and require engineering-assisted onboarding — and unlike the DIY modal that never gets built — CancelKit installs with one script tag, pays for itself with a single saved customer, and gets smarter with every cancellation it sees.

### Brand Personality

CancelKit talks like a sharp operator: the engineer-founder friend who answers questions with numbers, reads the API docs so you don't have to, and respects your time because they count their own minutes too. In conversation they're direct without being cold — they'll tell you exactly what permissions the OAuth grant includes before you ask, because they'd want to know. They'd wear whatever was clean. They would never say "revolutionize," never hide the cancel button, never use an exclamation point where a number would do, and never claim security — they'd show the mechanism. When something breaks, they say what broke, what it affects, and what to do, in that order. Their idea of marketing is a stopwatch screenshot.

### Voice & Tone Guide

The voice is constant: precise, numeric, mechanism-over-adjective, quietly confident. Tone shifts by context — brisk in marketing, calm and exact in errors, warm (but still numeric) in success moments.

| Context | DO | DON'T |
|---|---|---|
| Onboarding | "Connect Stripe. You'll see your own cancel flow working in about 10 seconds — before installing anything." | "Welcome to CancelKit! Let's get you set up on your retention journey! 🚀" |
| Error states | "Stripe rejected the coupon (expired 06/12). Pick another — your subscriber is still on the page." | "Oops! Something went wrong. Please try again later." |
| Empty states | "No cancel sessions yet. The widget is live and listening — this page fills in the moment someone clicks cancel." | "Nothing to see here yet!" |
| Success messages | "You just saved Sarah K. — $99/mo retained. That's this year's subscription paid for, twice." | "Great news! A customer decided to stay! 🎉" |
| Marketing copy | "Live in 5 minutes. $39/mo. One saved customer pays for the year." | "The world's most powerful, seamless churn-reduction platform." |
| Security copy | "Scoped OAuth: we can pause a subscription and apply a coupon. We cannot issue refunds, change plans, or see your bank details. Every webhook is signature-verified and idempotent." | "Bank-grade security you can trust." |
| Monthly report | "6 saves, $312 MRR retained — 8x what you paid us." | "Your monthly retention insights are ready!" |

### Messaging Framework

**Tagline:** The easiest cancellation flow on Earth.

**Homepage headline:** Your cancel button fires instantly. Fix that in 5 minutes. — with subhead: "CancelKit turns cancel clicks into pauses, discounts, and exit feedback. One script tag. $39/mo. One saved customer pays for the year."

**Value propositions:**
1. **Live before your coffee cools.** Connect Stripe, see your own working cancel flow in 10 seconds, paste one script tag. Five minutes, stopwatch-measured, published on this page.
2. **One save pays for it.** At $39/mo, a single retained $99 customer covers two months. The monthly receipt shows the multiple.
3. **Every cancel teaches you something.** Even the ones that leave tell you why — exit reasons on 100% of cancellations, not the 4% who answer your email a week later.

**Feature descriptions (voice samples):** "Pause instead of cancel — `pause_collection`, resume date set, no proration surprises." "Coupon offers pulled from your existing Stripe coupons — nothing new to configure." "Signed widget config: nobody can spoof offers on your behalf."

**Objection handlers.** *"I could build this myself."* — You could. It's the maintenance you're actually pricing: webhook edge cases, pause-vs-period-end logic, and a flow that improves from thousands of cancel sessions instead of just yours. Five minutes vs. a weekend, then zero maintenance vs. forever. *"I'm not giving a stranger write access to Stripe."* — Correct instinct. Here's the exact scope: pause and coupon-apply, nothing else; here's the security page; try the sandbox first — it needs nothing. *"My churn isn't that bad."* — What was it last month? If you don't know the number, that's the first thing CancelKit fixes, and the exit reasons are yours even when nobody takes an offer.

### Elevator Pitches

**5-second:** CancelKit turns your Stripe cancel button into a save flow — live in five minutes, one saved customer pays for the year.

**30-second:** Bootstrapped SaaS founders lose customers through a cancel button that fires instantly — no reason captured, no counter-offer, nothing. The tools that fix it cost $250 a month and need an engineering integration. CancelKit is a widget: connect Stripe, and ten seconds later you're looking at your own product's cancel flow offering pauses and discounts, using your real coupons. Paste one script tag and it's live. $39 a month; the first saved customer pays for the year.

**2-minute:** Every SaaS founder under $50k MRR has the same leak: the cancel button. A subscriber clicks it, the subscription dies instantly, and the founder learns nothing — not the reason, not whether a 30-day pause would have kept them. Multiply by 15 cancels a month and it's the growth ceiling. The fix exists — Churnkey, ProsperStack — but it's built for enterprise: $250+ monthly, sales calls, engineering-assisted onboarding. Below $50k MRR, the answer today is literally nothing. CancelKit closes that gap with the easiest cancellation flow on Earth. One click connects Stripe; ten seconds later the founder sees their own logo, plans, and coupons inside a working cancel flow — before installing anything. One script tag makes it live: exit reason, then a pause or discount offer, executed against Stripe with idempotent, signature-verified webhooks — billing state stays exact, and "cancel anyway" is always one click, no dark patterns. Why now: the sub-$50k SaaS tier has exploded while retention tooling stayed enterprise-shaped. Why us: this is a security-engineering product wearing a widget costume — OAuth trust, cross-origin embeds, billing idempotency — and that's the builder's home turf. Every cancel session feeds a cross-tenant dataset, so the offers get smarter with every customer — which is the moat a DIY afternoon can never copy. It's $39 a month, and the first saved customer pays for the year. Try the sandbox — it takes ten seconds and asks for nothing.

### Competitive Differentiation Narrative

The retention-software market made a rational choice to chase enterprise contracts, and left a structural gap behind: Churnkey, ProsperStack, and Chargebee Retention all assume an engineering team to integrate, a procurement process to survive, and $250+ a month to justify — which is why their customers start where CancelKit's stop. Below $50k MRR, the "competitor" is a bare HTML button wired to `subscription.cancel`, and the runner-up is a DIY modal the founder never finds an afternoon to build. CancelKit is shaped for exactly that vacuum: the entire integration is one OAuth click and one script tag, the price maps to a single saved customer, and the branded sandbox preview compresses the sales cycle to ten seconds by showing founders their own product already saved rather than telling them about features. The incumbents cannot follow without dismantling their own sales-led economics; the DIY founder cannot follow because the product's compounding asset — cross-tenant data on which offers convert for which exit reasons — only exists at the network level. Speed wins the install; the data wins the years after.

## 5. Visual Design

Visual design tokens (colors, typography, spacing, components, motion) live in `docs/design.md`. If that file does not yet exist, run the Design System skill with image references to generate it before building.
