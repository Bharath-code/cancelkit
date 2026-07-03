import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  headers: async () => [
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
