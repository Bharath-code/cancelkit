import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ck_session";
const EXPIRY = "7d";

export type SessionPayload = {
  accountId: string;
  stripeAccountId: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("SESSION_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.accountId !== "string" ||
      typeof payload.stripeAccountId !== "string"
    ) {
      return null;
    }
    return {
      accountId: payload.accountId,
      stripeAccountId: payload.stripeAccountId,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};
