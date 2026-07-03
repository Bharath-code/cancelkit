"use client";

import { useEffect } from "react";
import { capture } from "@/lib/posthog";

export function Hero({ loggedIn = false }: { loggedIn?: boolean }) {
  useEffect(() => {
    capture("landing_viewed");
  }, []);

  return (
    <section className="mx-auto max-w-[720px] px-6 pt-24 pb-16 text-center">
      <h1 className="text-[48px] font-bold leading-[1.1] tracking-tight">
        Your cancel button fires instantly. Fix that in 5 minutes.
      </h1>
      <p className="mt-6 text-lg text-muted">
        CancelKit turns cancel clicks into pauses, discounts, and exit
        feedback. One script tag. $39/mo. One saved customer pays for the year.
      </p>
      {loggedIn ? (
        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium leading-none text-on-primary transition-colors hover:bg-primary-hover"
          style={{ lineHeight: "20px" }}
        >
          Open dashboard
        </a>
      ) : (
        <a
          href="/api/oauth/start"
          onClick={() => capture("oauth_started")}
          className="mt-8 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium leading-none text-on-primary transition-colors hover:bg-primary-hover"
          style={{ lineHeight: "20px" }}
        >
          Connect Stripe
        </a>
      )}
    </section>
  );
}
