"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { captureException } from "./lib/sentry";
import { stripeClient } from "./lib/stripeClient";
import { REASONS } from "./constants";
import { SaveEmail, saveEmailSubject } from "../emails/save-email";
import { RevokedEmail, revokedEmailSubject } from "../emails/revoked-email";
import { MonthlyReceipt, receiptSubject } from "../emails/monthly-receipt";

const FOUNDER_RATE_CENTS = 2400; // $24/mo founder rate (PRD § 14 #1 default)

function fromAddress(): string {
  return process.env.RESEND_FROM || "CancelKit <onboarding@resend.dev>";
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// One retry then Sentry — email is best-effort, never blocks a resolve.
async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email disabled — no RESEND_API_KEY] would send to ${to}: ${subject}`);
    return;
  }
  const resend = new Resend(key);
  const attempt = () => resend.emails.send({ from: fromAddress(), to, subject, html });
  const first = await attempt();
  if (first.error) {
    const second = await attempt();
    if (second.error) {
      await captureException(new Error(`resend failed: ${second.error.message}`), {
        subject,
      });
    }
  }
}

export const sendSaveEmail = internalAction({
  args: { sessionId: v.id("cancelSessions") },
  handler: async (ctx, { sessionId }) => {
    const found = await ctx.runQuery(internal.widget.getSession, { id: sessionId });
    if (!found) return null;
    const { session, account } = found;
    if (
      session.sandbox ||
      !account.email ||
      (session.outcome !== "saved_pause" && session.outcome !== "saved_coupon")
    ) {
      return null;
    }

    // Best-effort customer name; fall back to a customer-id fragment.
    let customerLabel = `cus_…${session.stripeCustomerId.slice(-4)}`;
    try {
      const customer = await stripeClient().customers.retrieve(
        session.stripeCustomerId,
        {},
        account.stripeAccountId === "self"
          ? {}
          : { stripeAccount: account.stripeAccountId }
      );
      if (!customer.deleted && customer.name) customerLabel = customer.name;
    } catch {
      // keep the fragment
    }

    const amount = money(session.mrrCents);
    const html = await render(
      createElement(SaveEmail, {
        customerLabel,
        amount,
        planNickname: session.planNickname ?? "their plan",
        outcome: session.outcome,
      })
    );
    await send(account.email, saveEmailSubject(customerLabel, amount), html);
    return null;
  },
});

export const sendRevokedEmail = internalAction({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    const account = await ctx.runQuery(internal.accounts.getById, { id: accountId });
    if (!account?.email) return null;
    const html = await render(
      createElement(RevokedEmail, { businessName: account.businessName })
    );
    await send(account.email, revokedEmailSubject, html);
    return null;
  },
});

// Dunning-lite: one email on the transition into past_due (PRD § 11).
export const sendDunningEmail = internalAction({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    const account = await ctx.runQuery(internal.accounts.getById, { id: accountId });
    if (!account?.email) return null;
    const appUrl = process.env.APP_URL ?? "";
    await send(
      account.email,
      "CancelKit payment failed — widget stays on for 14 days",
      `<p>Your CancelKit payment failed. The widget keeps serving your customers
for 14 days while you fix it — after that it disables (your native cancel
button keeps working either way).</p>
<p><a href="${appUrl}/billing">Update your payment method</a> — takes a minute.</p>`
    );
    return null;
  },
});

// Cron: 1st of the month. Accounts with sessions last month get the receipt;
// zero-save accounts get the exit-reason summary variant.
export const monthlyReceipts = internalAction({
  args: {},
  handler: async (ctx) => {
    const digests = await ctx.runQuery(internal.cancelSessions.monthlyDigest, {});
    let sent = 0;
    for (const d of digests) {
      if (!d.email) continue;
      const amount = money(d.savedMrrCents);
      const multiple = `${Math.max(1, Math.round(d.savedMrrCents / FOUNDER_RATE_CENTS))}x`;
      const reasonSummary = Object.entries(d.reasons)
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({
          label: REASONS.find((r) => r.value === value)?.label ?? value,
          count,
        }));
      const html = await render(
        createElement(MonthlyReceipt, {
          saves: d.saves,
          amount,
          multiple,
          reasonSummary,
        })
      );
      await send(d.email, receiptSubject(d.saves, amount), html);
      sent++;
    }
    return sent;
  },
});
