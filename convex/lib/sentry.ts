// Minimal manual Sentry capture for Convex (no SDK — fetch to the store API).
// Scrub rules are the twin of src/lib/sentry-scrub.ts — keep in sync.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const CUSTOMER_ID_RE = /\bcus_[A-Za-z0-9]+\b/g;

function scrub(s: string): string {
  return s
    .replace(EMAIL_RE, "[email]")
    .replace(CUSTOMER_ID_RE, "cus_[scrubbed]");
}

export async function captureException(
  error: unknown,
  context?: Record<string, string>,
  dsnOverride?: string
): Promise<void> {
  const dsn = dsnOverride || process.env.SENTRY_DSN;
  if (!dsn) return; // Sentry disabled
  try {
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
    if (!m) return;
    const [, publicKey, host, projectId] = m;
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
        : String(error);
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      message: { formatted: scrub(message) },
      tags: { runtime: "convex", ...mapValues(context ?? {}, scrub) },
    };
    await fetch(
      `https://${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );
  } catch {
    // never let error reporting throw
  }
}

function mapValues(
  obj: Record<string, string>,
  fn: (s: string) => string
): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
}
