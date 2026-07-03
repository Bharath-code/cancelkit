import { NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "ck_oauth_state";

export async function GET() {
  const clientId = process.env.STRIPE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Stripe Connect is not configured (STRIPE_CLIENT_ID missing)" },
      { status: 500 }
    );
  }

  const nonce = crypto.randomUUID();
  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("state", nonce);
  url.searchParams.set("redirect_uri", `${appUrl}/api/oauth/callback`);

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
