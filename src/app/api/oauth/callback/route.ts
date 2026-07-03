import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "convex/nextjs";
import * as Sentry from "@sentry/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const OAUTH_STATE_COOKIE = "ck_oauth_state";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  // Founder denied consent (PRD § 11: calm message + /security + retry).
  if (params.get("error")) {
    return NextResponse.redirect(`${appUrl}/?oauth=denied`);
  }

  // CSRF: state must match the nonce cookie.
  const state = params.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !cookieState || state !== cookieState) {
    Sentry.captureMessage("OAuth state mismatch", "warning");
    return new NextResponse("Invalid OAuth state", { status: 403 });
  }

  const code = params.get("code");
  if (!code) {
    return NextResponse.redirect(`${appUrl}/oauth-error`);
  }

  try {
    const { sessionToken } = await fetchAction(api.stripe.completeOAuth, {
      code,
    });
    const res = NextResponse.redirect(`${appUrl}/preview?welcome=1`);
    res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (err) {
    // Code exchange failed — error page with retry, no partial rows.
    Sentry.captureException(err);
    return NextResponse.redirect(`${appUrl}/oauth-error`);
  }
}
