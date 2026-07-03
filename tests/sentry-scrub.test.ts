import { expect, test } from "vitest";
import { scrubEvent, scrubString } from "../src/lib/sentry-scrub";

test("emails and customer ids are scrubbed from strings", () => {
  const out = scrubString("user jane@example.com on cus_Abc123XY canceled");
  expect(out).not.toContain("jane@example.com");
  expect(out).not.toContain("cus_Abc123XY");
  expect(out).toContain("[email]");
  expect(out).toContain("cus_[hash:");
});

test("event objects lose emails and request bodies", () => {
  const event = {
    message: "error for bob@test.io",
    user: { email: "bob@test.io", id: "u1" },
    request: { url: "/widget/resolve", data: { secret: "x" } },
    extra: { note: ["contact a@b.co", { deep: "cus_Deep123" }] },
  };
  const out = scrubEvent(event) as typeof event;
  expect(JSON.stringify(out)).not.toContain("bob@test.io");
  expect(out.user.email).toBeUndefined();
  expect(out.request.data).toBeUndefined();
  expect(out.request.url).toBe("/widget/resolve");
  expect(JSON.stringify(out.extra)).not.toContain("cus_Deep123");
});
