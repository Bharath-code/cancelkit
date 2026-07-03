import { Card } from "@/components/ui/card";

export default function OAuthErrorPage() {
  return (
    <main className="mx-auto max-w-[720px] flex-1 px-6 py-24">
      <Card>
        <h1 className="text-2xl font-semibold">
          Stripe didn&apos;t complete the connection
        </h1>
        <p className="mt-3 text-sm text-muted">
          The code exchange with Stripe failed — nothing was created on our
          side. This is usually transient on Stripe&apos;s end.
        </p>
        <a
          href="/api/oauth/start"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          Try again
        </a>
      </Card>
    </main>
  );
}
