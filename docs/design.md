---
version: alpha
name: CancelKit
description: Design system for CancelKit — a Stripe-connected cancellation widget and founder dashboard, built to feel like a sharp operator's tool.
colors:
  primary: "#16181D"
  on-primary: "#FFFFFF"
  accent: "#4353FF"
  on-accent: "#FFFFFF"
  background: "#FAFAF9"
  surface: "#FFFFFF"
  on-surface: "#16181D"
  on-surface-muted: "#5C616B"
  border: "#E4E4E7"
  success: "#0F9960"
  on-success: "#FFFFFF"
  success-surface: "#E7F6EF"
  warning: "#B45309"
  warning-surface: "#FDF3E7"
  error: "#DC2626"
  error-surface: "#FDECEC"
  info: "#2563EB"
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.02em
  stat:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
    fontFeature: tnum
  mono:
    fontFamily: JetBrains Mono, ui-monospace, monospace
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: "#2A2E38"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-primary-disabled:
    backgroundColor: "#C9CBD1"
    textColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-secondary-hover:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  button-cancel-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    height: 40px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    height: 40px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    height: 40px
  input-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  stat:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.stat}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  badge-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  badge-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    width: 480px
---

# CancelKit Design System

## Overview

CancelKit is a Stripe-connected cancellation widget for bootstrapped B2B SaaS founders, plus the dashboard and landing page that sell and report on it. The user is a technical founder who distrusts marketing gloss and counts minutes; the end subscriber is a person mid-cancellation who deserves honesty. The design should feel like a sharp operator's tool: precise, numbers-first, quietly confident about security. The emotional response we want is "this was built by someone who respects my time and my billing data." Two anti-patterns define the boundaries: never look like an enterprise sales site (gradients, stock illustration, adjective-driven copy), and never let the widget read as a dark pattern (the cancel path stays visible and one click away).

## Colors

The palette is deliberately narrow: ink (`primary`, #16181D) does the work an accent usually does — primary buttons, headings, emphasis — which keeps the interface calm and lets numbers carry the weight. `accent` (#4353FF) is reserved for interactive emphasis and links, a confident indigo that reads fintech-trustworthy without cloning Stripe's violet. `success` (#0F9960) is the emotional color of the product — every save event, saved-revenue stat, and "You just saved a customer" moment renders in it, paired with `success-surface` for badges and callouts. `warning` and `error` follow the same solid-plus-surface pattern and appear only for real billing states, never decoration. Backgrounds are warm-neutral (`background` #FAFAF9) with pure white `surface` cards so layering works without shadows. All text pairs meet WCAG AA: `on-surface` and `on-surface-muted` both clear 4.5:1 on `surface`. Light mode only — the widget embeds in other people's products and must default neutral.

## Typography

Inter everywhere, for the same reason Stripe-tier tools use it: neutral, legible at dashboard densities, and it has real tabular numerals. The `stat` level (40px/700 with `tnum`) exists because saved-revenue numbers are the product's proof — they get the largest, tightest type on any screen. `display` and `h1` are for landing-page claims ("Live in 5 minutes. $39/mo."); `h2`/`h3` structure the dashboard; `body` and `body-sm` do the work; `caption` labels stats and badges with slight positive tracking. `mono` (JetBrains Mono) renders the script tag, webhook payloads, and anything copy-pasteable — the install moment is a code moment and should look like one. Never introduce a serif or display face; the voice is "every claim is a number," and the type should get out of the number's way.

## Layout

Spacing runs a 4px base scale from `xs` (4px) to `3xl` (64px), with `md` (16px) as the default gap and `lg` (24px) as card padding. Density is comfortable, not tight: founders scan this dashboard between support tickets, so one glance should yield the number they came for. Content maxes at ~1080px in the dashboard and ~720px for prose; the widget itself is a single 480px column. Group related stats in rows of 3–4 cards; never nest cards inside cards. Whitespace is the trust signal — a cramped layout reads as a cluttered enterprise tool, which is the competitor set we're pricing against.

## Elevation & Depth

Borders first, shadows almost never. Surfaces separate from the background via `border` (#E4E4E7) 1px lines and the background/surface contrast — flat, technical, precise. The single exception is the modal/widget overlay, which floats over someone else's product and needs one soft, large shadow (`0 8px 30px rgba(22,24,29,0.12)`) plus a scrim to establish that it is a layer, not part of the host page. No stacked elevation levels, no glow effects, no inner shadows. If a component seems to need a shadow to be visible, the real problem is its border or contrast.

## Shapes

Slightly rounded, never soft: `sm` (4px) for small controls and code blocks, `md` (8px) for buttons and inputs, `lg` (12px) for cards and the modal, `full` only for badges and status dots. This sits deliberately between sharp-corner developer austerity and the 16–24px friendliness of consumer SaaS — CancelKit is a precision tool that ordinary subscribers also touch, so it can't feel hostile or toy-like. Radius never varies within a component class; every button on a screen shares `md`.

## Components

Buttons: `button-primary` is ink-on-white and used once per view for the main action (Connect Stripe, Save offer); its hover lifts to #2A2E38 and disabled drops to a flat gray with no cursor change games. `button-secondary` is a bordered white button for everything else. `button-cancel-ghost` is a deliberate, protected component: it renders the subscriber's "Cancel anyway" path in muted text, always visible, always enabled, never shrunk below `body-sm` — this is the anti-dark-pattern contract made into a token. Inputs are 40px tall matching buttons; focus swaps the border to `accent` with a 3px soft ring, and error states use `error` border plus a `body-sm` message in `error` — messages state the mechanism ("Stripe rejected the coupon — expired 06/12"), never just "something went wrong." `card` is the dashboard workhorse; `stat` is a card whose number renders in the `stat` type level with a `caption` label above and, when the number is saved revenue, `success` color. `badge-success`/`badge-warning` are pill-shaped status markers for save events and billing states. `modal` is the widget container itself: 480px, `lg` radius, the one shadowed element in the system.

## Do's and Don'ts

**Do:**
- Lead every screen with a number the founder cares about, set in the `stat` type level with tabular numerals.
- Use `success` green for every save event and saved-revenue figure — it is the product's emotional payoff.
- Keep one `button-primary` per view; everything else is secondary or ghost.
- Write error states with the mechanism and the next step, in `body-sm`, using semantic colors.
- Render anything copy-pasteable (script tag, webhook URLs) in `mono` inside a `sm`-radius block with a copy button.
- Keep the widget's "Cancel anyway" path visible, enabled, and one click away in every flow state.

**Don't:**
- Don't add gradients, stock illustrations, testimonial carousels, or any enterprise-marketing furniture.
- Don't use more than one accent color per view, or use `accent` for non-interactive decoration.
- Don't shrink, hide, delay, or bury the subscriber's cancel path — no confirm-shaming copy, ever.
- Don't add shadows to anything except the modal/widget overlay.
- Don't introduce new typefaces, radius values, or off-scale spacing; extend the token scales instead.
- Don't let any asset or animation delay the 10-second sandbox preview — the magic moment outranks polish.
