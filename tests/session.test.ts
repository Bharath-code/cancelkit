import { beforeAll, expect, test } from "vitest";
import { verifySessionToken } from "../convex/lib/auth";

const SECRET = "test-secret-0123456789abcdef0123456789abcdef";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = SECRET;
});

test("signSession produces a token verifySessionToken accepts", async () => {
  const { signSession } = await import("../src/lib/session");
  const token = await signSession({
    accountId: "acc123",
    stripeAccountId: "acct_test",
  });
  const payload = await verifySessionToken(token, SECRET);
  expect(payload).toEqual({ accountId: "acc123", stripeAccountId: "acct_test" });
});

test("tampered token is rejected", async () => {
  const { signSession } = await import("../src/lib/session");
  const token = await signSession({
    accountId: "acc123",
    stripeAccountId: "acct_test",
  });
  const [h, p, s] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ accountId: "evil", stripeAccountId: "acct_evil" })
  ).toString("base64url");
  expect(await verifySessionToken(`${h}.${tamperedPayload}.${s}`, SECRET)).toBeNull();
  expect(await verifySessionToken(`${h}.${p}.${s}`, "wrong-secret")).toBeNull();
  expect(await verifySessionToken("not-a-jwt", SECRET)).toBeNull();
});
