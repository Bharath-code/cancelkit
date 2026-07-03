// HMAC-SHA256(customerId, widgetSecret) → hex, with timing-safe comparison.

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
  hmac: string,
  widgetSecret: string
): Promise<boolean> {
  const expected = await computeHmac(customerId, widgetSecret);
  return timingSafeEqualHex(expected, hmac.toLowerCase());
}
