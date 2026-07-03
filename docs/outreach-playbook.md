# CancelKit Outreach Playbook — First 10 Customers

The days-1–14 motion from `product-vision.md` / `validation-report.md` § First 10 Customers, made operational. Success gates: 10 replies → 5 calls → 3 paying installs from 30 personalized messages.

## The Motion at a Glance

| Days | Step | Asset | Success gate |
|------|------|-------|--------------|
| 1–2 | Product mining: click 30 real cancel flows | Screenshot of their bare cancel button | 10 replies |
| 3–8 | Personalized demo link + 30s Loom | `cancelkit.com/demo/<slug>` + Loom | 5 calls booked |
| 8–14 | White-glove install on the call | Live OAuth + script-tag paste | 3 paying installs ($24/mo founder rate, 30-day refund) |

Charge from day one. No free tier. The founder rate ($24/mo) is the ask on every call.

## Days 1–2: Product Mining Checklist

Source pools: IndieHackers product directory, r/SaaS "what are you building" threads, X build-in-public MRR screenshots. Target: bootstrapped B2B SaaS, $5k–50k MRR, billing on Stripe.

Per prospect (10–15 minutes each):

1. **Qualify:** Stripe checkout visible? (Look for `checkout.stripe.com` or Stripe Elements on the pricing page.) B2B SaaS with monthly plans? Founder reachable on X/IndieHackers/email?
2. **Sign up** for the cheapest plan (or trial). Use a real card if needed — this is the cost of the campaign.
3. **Click cancel.** Screen-record the whole path. If it fires instantly with no save attempt — that's a prospect. If they already have Churnkey/ProfitWell — skip, note the tool.
4. **Screenshot the bare moment:** the exact frame where the cancel button just… cancels. This screenshot IS the opening message.
5. **Log it:** product, founder, channel, plan price, cancel-flow verdict, screenshot path.
6. **Ask cancel volume early** (in the first exchange, before pitching): "roughly how many cancels a month?" — if interested founders cluster under ~15/month, assumption #2 fires (reprice or move the ICP band up). Log every answer.

Refund/cancel your own subscriptions as you go. You just tested their cancel flow twice.

## The Screenshot Opener

Send on whichever channel the founder is actually active (X DM > IndieHackers DM > email).

> [screenshot of their bare cancel button]
>
> This fires instantly. Want to see what it could do instead? Here's {Product} with a working save flow: cancelkit.com/demo/{slug}
>
> Took me 4 minutes to mock up. Real one installs in about the same.

Rules (voice per product-vision § personality):
- No exclamation points where a number would do.
- Never open with a feature list. The screenshot + their own demo link is the whole pitch.
- If they reply with anything but "no": send the Loom, ask for 15 minutes. Not an install — a look.

## Creating the Demo Link

One command per prospect (mock is built from public info — their pricing page):

```bash
npx tsx scripts/create-demo.ts <slug> "<Product Name>" \
  --color "#1A73E8" \
  --plan "Pro:4900:month" --plan "Team:19900:month" \
  --coupon "SAVE20:20"
```

- `slug` → the link: `https://cancelkit.com/demo/<slug>` (locally `http://localhost:3000/demo/<slug>`)
- `--color` → their brand color (grab from their site header/button)
- `--plan nickname:cents:interval` → copy their real plan names and prices from the pricing page
- `--coupon id:percent` → optional; a plausible save offer. Omit → pause offer shown instead.

The demo page answers "how does it know my coupons?" honestly on-page: it doesn't yet — this one is mocked from public info; connect Stripe and it's real.

## The 30-Second Loom (script outline)

Record over their demo link. One take, no editing. Target 30–40 seconds.

1. **(0–5s)** Their cancel flow, the screenshot moment: "This is your cancel button today. One click, customer gone."
2. **(5–15s)** Click cancel on their demo: "Same click, with CancelKit. It asks why, then offers a pause or your own {SAVE20} coupon — your plans, your branding."
3. **(15–25s)** Click through reason → offer → accept: "Pause hits Stripe's `pause_collection` — real billing state, not a support ticket. Cancel is still right there; we never trap anyone."
4. **(25–35s)** Close: "Install is one script tag, about 5 minutes. $24/month founder rate, 30-day refund. 15 minutes this week to set it up together?"

## Days 8–14: White-Glove Call Agenda (15 min)

Every call is recorded (with permission) — install-friction transcripts are the product backlog (assumption #7).

1. **(2 min) Their numbers first:** "How many cancels a month? What do you do about them today?" — log the volume answer.
2. **(5 min) Live install, they drive:**
   - They click Connect Stripe. **Watch the OAuth screen silently.** Every hesitation, every permission they read aloud, every "wait, what can you see?" is the trust-barrier data (risk #1). Note it verbatim.
   - Preview renders from their real coupons/plans. Stopwatch the OAuth → preview time; if it feels slow, log it.
   - They paste the script tag (Install page has copy-paste snippets incl. HMAC examples for Node/Python/Ruby).
   - Test: click cancel on their site, see the widget.
3. **(3 min) Two questions, verbatim answers logged:**
   - "You're clearly capable of building this — why haven't you?" (the build-vs-buy objection, from their own mouth)
   - "What would make you uninstall this?"
4. **(3 min) Close:** founder rate $24/mo, 30-day refund, charge starts today. Checkout link on the Billing page.
5. **(2 min) Ask for the testimonial seed:** "When the first save email lands, would you screenshot it?" — the save-email screenshot loop is the distribution model.

## Tracking

Log every prospect in a flat sheet: product, founder, channel, cancel-flow verdict, sent date, replied?, demo slug, Loom URL, call date, cancel volume, OAuth completed?, installed?, paid?. The leading indicators to watch weekly (from product-vision § metrics):

- Reply rate on screenshot openers: **good = 33%** (10 of 30)
- Sandbox open → OAuth click-through: **good = 25%**
- Call → paid conversion: **good = 60%**
- Live OAuth completions from 30 links: **good = 3+, great = 8+** (primary metric)

If founders love the demo but stall at the OAuth screen → pivot signal: sell the read-only sandbox as a paid cancel-flow audit first, earn write access second.
