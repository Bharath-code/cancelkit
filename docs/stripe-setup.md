# Stripe Setup — CancelKit

Manual steps performed in the Stripe Dashboard. Everything below runs in **test mode** until TASK-060 (production cutover).

## 1. Platform account + Connect OAuth (TASK-013)

1. Create (or use) your Stripe account — this is the **platform** account.
2. Dashboard → **Settings → Connect → Onboarding options → OAuth**: enable OAuth for **standard accounts**.
3. Add redirect URIs (exact match, no trailing slash):
   - `http://localhost:3000/api/oauth/callback`
   - `https://<your-prod-domain>/api/oauth/callback`
4. **Settings → Connect → Platform branding**: set name **CancelKit** and upload the icon — this is what founders see on the consent screen; it is trust-critical.
5. Record credentials:
   - `STRIPE_CLIENT_ID` — Settings → Connect → OAuth (test-mode client id, `ca_...`)
   - `STRIPE_SECRET_KEY` — Developers → API keys (test-mode secret key, `sk_test_...`)

## 2. Where the keys go

```bash
# .env.local (Next.js)
STRIPE_CLIENT_ID=ca_...

# Convex env (used by actions)
npx convex env set STRIPE_SECRET_KEY sk_test_...
npx convex env set STRIPE_CLIENT_ID ca_...
```

## 3. Webhooks (Phase 2, TASK-031)

Create two endpoints pointing at the Convex HTTP action URL
`https://<deployment>.convex.site/stripe/webhook` (note `.site`, not `.cloud`):

1. **Platform events**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` → record secret as `STRIPE_WEBHOOK_SECRET_PLATFORM`
2. **Connect account events** (listen to *events on connected accounts*): `customer.subscription.updated`, `customer.subscription.deleted`, `account.application.deauthorized` → record secret as `STRIPE_WEBHOOK_SECRET_CONNECT`

```bash
npx convex env set STRIPE_WEBHOOK_SECRET_PLATFORM whsec_...
npx convex env set STRIPE_WEBHOOK_SECRET_CONNECT whsec_...
```

For local dev use the Stripe CLI: `stripe listen --forward-to <deployment>.convex.site/stripe/webhook`.

## Verification checklist

- [ ] Visiting `/api/oauth/start` renders Stripe's consent screen with CancelKit branding
- [ ] Test-mode OAuth round-trip creates exactly one `accounts` row; a second round-trip creates none

## 4. Resend (TASK-038)

1. Create a Resend account → Domains → add your sending domain.
2. Add the SPF + DKIM DNS records Resend shows you; wait for "Verified".
3. Set the env:

```bash
npx convex env set RESEND_API_KEY re_...
npx convex env set RESEND_FROM "CancelKit <save@yourdomain.com>"
```

Until these are set, email sends are skipped and logged (`[email disabled…]`).

## 5. Platform products — CancelKit's own billing (TASK-041)

On the **platform** account (test mode first):

1. Products → Add product "CancelKit":
   - Price `founder-rate`: $24/mo recurring → record id as `STRIPE_FOUNDER_PRICE_ID`
   - Price `standard`: $39/mo recurring (dormant, for later)
2. Settings → Billing → Customer portal: enable, allow payment-method updates,
   **hide the cancel option** (cancellation goes through CancelKit's own widget).
3. Env:

```bash
npx convex env set STRIPE_FOUNDER_PRICE_ID price_...
```

4. Seed the reserved self-account (dogfooded cancel) once per deployment:

```bash
npx convex run billing:seedSelfAccount '{}'
```
