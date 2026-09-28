"use client";

import { useEffect } from "react";
import Link from "next/link";
import { capture } from "@/lib/posthog";
import { Logo } from "@/components/brand/Logo";
import { FlowGraphic } from "@/components/brand/FlowGraphic";
import { buttonBase, buttonVariants } from "@/components/ui/button";

export function Hero({ loggedIn = false }: { loggedIn?: boolean }) {
  useEffect(() => {
    capture("landing_viewed");
  }, []);

  return (
    <section className="ink-grid relative overflow-hidden rounded-b-[var(--radius-xl)] text-white">
      <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="CancelKit home">
          <Logo onInk />
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <a href="#demo" className="hidden rounded-full px-3 py-2 text-[#C9D3E1] hover:text-white sm:block">
            Try it
          </a>
          <Link href="/security" className="rounded-full px-3 py-2 text-[#C9D3E1] hover:text-white">
            Security
          </Link>
          <a href="#pricing" className="rounded-full px-3 py-2 text-[#C9D3E1] hover:text-white">
            Pricing
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr]">
          <h1 className="animate-rise font-display text-[clamp(44px,8vw,92px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
            Catch the cancel.
            <br />
            <span className="text-[#8FA0BA]">Never trap it.</span>
          </h1>
          <div className="animate-rise [animation-delay:120ms]">
            <p className="text-lg leading-relaxed text-[#C9D3E1]">
              CancelKit puts one fair offer — a pause or a discount — between
              your cancel button and Stripe. &ldquo;Cancel anyway&rdquo; stays
              one click away, and if CancelKit ever fails, your own button
              still works.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {loggedIn ? (
                <a href="/dashboard" className={`${buttonBase} ${buttonVariants.marigold}`}>
                  Open dashboard
                </a>
              ) : (
                <a
                  href="/api/oauth/start"
                  onClick={() => capture("oauth_started")}
                  className={`${buttonBase} ${buttonVariants.marigold}`}
                >
                  Connect Stripe
                </a>
              )}
              <a
                href="#demo"
                className={`${buttonBase} border border-white/20 text-white hover:bg-white/10`}
              >
                Try the flow first
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 animate-rise [animation-delay:240ms] sm:mt-14">
          <FlowGraphic />
        </div>
      </div>
    </section>
  );
}
