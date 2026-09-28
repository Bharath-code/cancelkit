import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      // anti-clickjacking for the app (kill switch, secret rotation).
      // /embed is excluded: it must load in the founder's site iframe.
      // ponytail: frame-ancestors only; full script-src CSP needs nonces for Next/PostHog/Sentry
      source: "/((?!embed).*)",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
    {
      // widget loader on the CDN: 1h cache, fast fixes (PRD § Infrastructure)
      source: "/v1/cancelkit.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=3600, stale-while-revalidate=86400",
        },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // no source-map upload until SENTRY_AUTH_TOKEN is configured
  sourcemaps: { disable: true },
  telemetry: false,
  // we use error capture only — strip tracing/replay code from the bundle
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
});
