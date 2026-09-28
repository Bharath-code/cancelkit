import { cookies } from "next/headers";
import Link from "next/link";
import { Hero } from "@/components/features/Hero";
import { LandingDemo } from "@/components/features/LandingDemo";
import { SaveCalculator } from "@/components/features/SaveCalculator";
import { Logo } from "@/components/brand/Logo";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const failures = [
  {
    when: "If CancelKit doesn’t answer within 3 seconds",
    then: "Your own cancel button runs, exactly as if CancelKit weren’t installed.",
  },
  {
    when: "If Stripe rejects the pause or the discount",
    then: "Nothing changes on the subscription, and “Cancel anyway” is still on screen.",
  },
  {
    when: "If you flip the kill switch",
    then: "Every subscriber gets your native cancel instantly. No deploy, no cache to wait on.",
  },
];

const objections = [
  {
    q: "“I could build this myself.”",
    a: "You could, and with an AI assistant it’s a weekend. What you’d be signing up for is the upkeep: webhook edge cases, pause-versus-period-end logic, what happens when Stripe times out mid-cancel. CancelKit is those decisions already made and tested.",
  },
  {
    q: "“I’m not giving a stranger write access to Stripe.”",
    a: "Right instinct, so here’s the straight answer. Stripe’s OAuth grant for this kind of connection is account-wide; it can’t be narrowed. What our code does with it is narrow: it reads plans and coupons, and it pauses, discounts, or cancels a subscription only when your page presents a signed request. The security page lists every call. You can revoke access from Stripe at any moment, and the widget stops the same second.",
  },
  {
    q: "“My churn isn’t that bad.”",
    a: "How many people canceled last month, and why? If you don’t know, that’s the first thing CancelKit gives you: a reason on every cancellation, even from the people who leave anyway.",
  },
];

function BypassIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-16 shrink-0" aria-hidden="true" fill="none">
      <path d="M4 28h56" stroke="#7C8A9E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 22l8 6-8 6" stroke="#7C8A9E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 28c0-16 28-16 28 0" stroke="#D8DFE8" strokeWidth="2.5" strokeDasharray="3 5" strokeLinecap="round" />
      <circle cx="32" cy="16" r="5" fill="#FFB400" opacity="0.35" />
      <path d="M29.5 13.5l5 5M34.5 13.5l-5 5" stroke="#9A5B00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string; auth?: string }>;
}) {
  const [cookieStore, params] = await Promise.all([cookies(), searchParams]);
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const loggedIn = token ? (await verifySession(token)) !== null : false;

  return (
    <div className="flex-1">
      <Hero loggedIn={loggedIn} />

      {(params.oauth === "denied" || params.auth === "required") && (
        <div className="mx-auto -mt-5 max-w-[720px] px-4 sm:px-6" role="status">
          <div className="animate-rise rounded-lg border border-border bg-surface px-5 py-4 text-sm shadow-[var(--shadow-modal)]">
            {params.oauth === "denied" ? (
              <>
                Nothing was connected. If it&apos;s a trust question,{" "}
                <Link href="/security" className="font-medium text-accent underline underline-offset-4">
                  here&apos;s exactly what CancelKit calls in Stripe
                </Link>
                .
              </>
            ) : (
              "That page needs a connected Stripe account. Connect it above to continue."
            )}
          </div>
        </div>
      )}

      <section id="demo" className="mx-auto max-w-[1120px] scroll-mt-6 px-4 py-20 sm:px-6 sm:py-28">
        <LandingDemo />
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-[clamp(30px,4vw,44px)] font-bold leading-[1.05]">
              Built to fail open.
            </h2>
            <p className="mt-4 max-w-[42ch] text-muted">
              A retention tool that breaks your cancel button is worse than no
              tool. It&apos;s also a legal problem: auto-renewal laws in about
              30 US states require a way out. So every failure path ends in the
              same place: the subscriber can leave.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {failures.map((f) => (
              <li key={f.when} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <BypassIcon />
                <div>
                  <p className="font-semibold">{f.when}</p>
                  <p className="mt-1 text-muted">{f.then}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1120px] scroll-mt-6 px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div className="ink-grid relative overflow-hidden rounded-xl p-8 text-white sm:p-10">
            <p className="text-[#C9D3E1]">Founder rate</p>
            <p className="font-display mt-2 text-[72px] font-extrabold leading-none tracking-[-0.04em]">
              $24<span className="text-2xl font-semibold text-[#8FA0BA]">/mo</span>
            </p>
            <p className="mt-4 max-w-[40ch] text-[#C9D3E1]">
              Everything, one tier: the widget, pause and discount offers,
              reasons on every cancel, the live dashboard, save emails. It
              goes to $39 later; you keep $24 for as long as you stay.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#E4EAF3]">
              {["No seats, no metering", "30-day refund, no questions", "Cancel CancelKit with CancelKit"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#34D399]" aria-hidden="true" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
            <a
              href={loggedIn ? "/billing" : "/api/oauth/start"}
              className="mt-8 inline-flex h-11 items-center rounded-full bg-marigold px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-[#ffc233]"
            >
              {loggedIn ? "Go to billing" : "Connect Stripe"}
            </a>
          </div>
          <SaveCalculator />
        </div>
      </section>

      <section className="mx-auto max-w-[760px] px-4 pb-24 sm:px-6">
        <h2 className="text-[clamp(28px,3.5vw,38px)] font-bold leading-tight">
          Three objections, answered straight
        </h2>
        <div className="mt-8 space-y-3">
          {objections.map((o) => (
            <details
              key={o.q}
              className="group rounded-lg border border-border bg-surface px-6 py-5 shadow-[var(--shadow-lift)] open:pb-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {o.q}
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45" aria-hidden="true" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-3 text-muted">{o.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-[60ch]">
            Our code reads plans and coupons, and pauses, discounts, or cancels
            a subscription only on a signed request from your page. It never
            issues refunds, changes prices, or touches payouts.{" "}
            <Link href="/security" className="font-medium text-accent underline underline-offset-4">
              Every Stripe call we make
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
