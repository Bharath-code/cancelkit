import { PreviewFrame } from "@/components/features/PreviewFrame";

export default function PreviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Your cancel flow — already working
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Built from your live Stripe data. Click through it — nothing here
        touches real billing.
      </p>
      <PreviewFrame />
    </div>
  );
}
