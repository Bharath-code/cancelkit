// HMAC-SHA256(`${customerId}.${ts}`, widgetSecret) → hex, timing-safe compare.
// ts (unix seconds) bounds replay: a leaked signature dies after the TTL.

// ponytail: 1h covers a page left open before the cancel click; an expired
// signature fails open (native cancel runs), so shorter = fewer saves.
export const HMAC_TTL_SECONDS = 60 * 60;
const CLOCK_SKEW_SECONDS = 60;

export async function computeHmac(
  message: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(sig), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export function signedMessage(customerId: string, ts: number): string {
  return `${customerId}.${ts}`;
}

// Constant-time hex comparison — never early-exits on mismatch.
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyHmac(
  customerId: string,
  ts: number,
  hmac: string,
  widgetSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  if (!Number.isInteger(ts)) return false;
  if (ts > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (nowSeconds - ts > HMAC_TTL_SECONDS) return false;
  const expected = await computeHmac(signedMessage(customerId, ts), widgetSecret);
  return timingSafeEqualHex(expected, hmac.toLowerCase());
}
