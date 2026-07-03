import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./src/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // empty = disabled
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend(event) {
    return scrubEvent(event);
  },
});
