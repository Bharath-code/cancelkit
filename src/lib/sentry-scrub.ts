// PII scrubbing shared by all Sentry configs (PRD § Security Considerations).
// Twin: convex/lib/sentry.ts uses the same rules — keep in sync.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const CUSTOMER_ID_RE = /\bcus_[A-Za-z0-9]+\b/g;

export function scrubString(s: string): string {
  return s
    .replace(EMAIL_RE, "[email]")
    .replace(CUSTOMER_ID_RE, (id) => `cus_[hash:${simpleHash(id)}]`);
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

// Walks a Sentry event-shaped object, scrubbing strings and dropping
// request bodies / user emails. Works on any JSON-ish value.
export function scrubEvent<T>(event: T): T {
  return walk(event) as T;
}

function walk(value: unknown, key?: string): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => walk(v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "data" && key === "request") continue; // never attach request bodies
      if (k === "email") continue;
      out[k] = walk(v, k);
    }
    return out;
  }
  return value;
}
