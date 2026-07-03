import { jwtVerify } from "jose";
import { ConvexError } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

export type SessionPayload = {
  accountId: string;
  stripeAccountId: string;
};

// Pure verify fn — extracted so it's unit-testable outside the Convex runtime.
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
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

export async function requireAccount(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string
): Promise<Doc<"accounts">> {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new ConvexError({ code: "misconfigured" });
  const payload = await verifySessionToken(sessionToken, secret);
  if (!payload) throw new ConvexError({ code: "unauthenticated" });
  const account = await ctx.db
    .query("accounts")
    .withIndex("by_stripe_account", (q) =>
      q.eq("stripeAccountId", payload.stripeAccountId)
    )
    .unique();
  if (!account || account._id !== payload.accountId) {
    throw new ConvexError({ code: "unauthenticated" });
  }
  return account;
}
