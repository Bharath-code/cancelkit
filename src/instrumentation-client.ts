import { scrubEvent } from "@/lib/sentry-scrub";

// Sentry's client is ~140KB gzip — loaded lazily (and only when a DSN is
// configured) to keep the landing page inside its 200KB initial-JS budget.
// ponytail: errors thrown before the async chunk lands are dropped; add a
// pre-init window.onerror buffer if that ever matters.
type SentryModule = typeof import("@sentry/nextjs");

let sentry: SentryModule | null = null;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import("@sentry/nextjs").then((S) => {
    S.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend(event) {
        return scrubEvent(event);
      },
    });
    sentry = S;
  });
}

export const onRouterTransitionStart: (href: string, navigationType: string) => void = (
  ...args
) => {
  sentry?.captureRouterTransitionStart(...args);
};
