import Stripe from "stripe";

// Fetch-based client so Stripe works in Convex's default runtime
// (actions and HTTP actions) without "use node".
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const subtleCryptoProvider = Stripe.createSubtleCryptoProvider();
