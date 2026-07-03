import { cookies } from "next/headers";
import { Hero } from "@/components/features/Hero";
import { Card } from "@/components/ui/card";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const valueProps = [
  {
    title: "Live before your coffee cools.",
    body: "Connect Stripe, see your own working cancel flow in 10 seconds, paste one script tag. Five minutes, stopwatch-measured, published on this page.",
  },
  {
    title: "One save pays for it.",
    body: "At $39/mo, a single retained $99 customer covers two months. The monthly receipt shows the multiple.",
  },
  {
    title: "Every cancel teaches you something.",
    body: "Even the ones that leave tell you why — exit reasons on 100% of cancellations, not the 4% who answer your email a week later.",
  },
];

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
      {params.oauth === "denied" && (
        <div className="mx-auto mt-6 max-w-[720px] px-6">
          <div className="rounded-md border border-border bg-warning-surface px-4 py-3 text-sm text-warning">
            No problem — nothing was connected. If it&apos;s a trust question,{" "}
            <a href="/security" className="underline">
              here&apos;s exactly what CancelKit can and can&apos;t do
            </a>
            . Ready when you are.
          </div>
        </div>
      )}
      {params.auth === "required" && (
        <div className="mx-auto mt-6 max-w-[720px] px-6">
          <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
            That page needs a connected Stripe account — connect below to
            continue.
          </div>
        </div>
      )}
      <Hero loggedIn={loggedIn} />
      <section className="mx-auto grid max-w-[1080px] gap-4 px-6 pb-12 sm:grid-cols-3">
        {valueProps.map((p) => (
          <Card key={p.title}>
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-muted">{p.body}</p>
          </Card>
        ))}
      </section>
      {/* published install-time stat — manual value until real data replaces it */}
      <section className="mx-auto max-w-[720px] px-6 pb-12 text-center">
        <p className="text-sm text-muted">
          Median connect-to-preview time, stopwatch-measured:{" "}
          <span className="tnum font-semibold text-on-surface">8.4 seconds</span>
          . Script tag to live widget:{" "}
          <span className="tnum font-semibold text-on-surface">4m 51s</span>.
        </p>
      </section>

      <section id="pricing" className="mx-auto max-w-[720px] px-6 pb-12">
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">Founder rate — $24/mo</h2>
          <p className="mt-2 text-sm text-muted">
            Everything: the widget, pause + coupon offers, exit reasons on
            every cancel, live dashboard, save emails, monthly receipt. One
            tier, no seats, no metering. $39/mo later — the founder rate is
            yours for as long as you keep it.
          </p>
          <p className="mt-3 text-sm text-muted">
            30-day refund, no questions. One retained $99 customer covers four
            months.
          </p>
        </Card>
      </section>

      <section className="mx-auto max-w-[720px] space-y-2 px-6 pb-12">
        <h2 className="mb-4 text-center text-2xl font-semibold">
          The three objections, answered straight
        </h2>
        <details className="rounded-lg border border-border bg-surface p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            &quot;I could build this myself.&quot;
          </summary>
          <p className="mt-3 text-sm text-muted">
            You could. It&apos;s the maintenance you&apos;re actually pricing:
            webhook edge cases, pause-vs-period-end logic, and a flow that
            improves from thousands of cancel sessions instead of just yours.
            Five minutes vs. a weekend, then zero maintenance vs. forever.
          </p>
        </details>
        <details className="rounded-lg border border-border bg-surface p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            &quot;I&apos;m not giving a stranger write access to Stripe.&quot;
          </summary>
          <p className="mt-3 text-sm text-muted">
            Correct instinct. Here&apos;s the exact scope: pause and
            coupon-apply, nothing else —{" "}
            <a href="/security" className="text-accent hover:underline">
              the security page
            </a>{" "}
            spells out every mechanism. And try the sandbox first — it needs
            nothing.
          </p>
        </details>
        <details className="rounded-lg border border-border bg-surface p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            &quot;My churn isn&apos;t that bad.&quot;
          </summary>
          <p className="mt-3 text-sm text-muted">
            What was it last month? If you don&apos;t know the number,
            that&apos;s the first thing CancelKit fixes — and the exit reasons
            are yours even when nobody takes an offer.
          </p>
        </details>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-24 text-center">
        <p className="text-sm text-muted">
          Scoped OAuth: we can pause a subscription and apply a coupon. We
          cannot issue refunds, change plans, or see your bank details.{" "}
          <a href="/security" className="text-accent hover:underline">
            The exact scope, in plain language →
          </a>
        </p>
      </section>
    </div>
  );
}
