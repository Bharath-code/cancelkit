import { PreviewFrame } from "@/components/features/PreviewFrame";

export default function PreviewPage() {
  return (
    <div>
      <h1 className="text-[32px] font-bold leading-tight">Your cancel flow, already working</h1>
      <p className="mt-1 mb-8 text-muted">
        Built from your Stripe plans and coupons. Click through it. Nothing
        here touches real billing.
      </p>
      <PreviewFrame />
    </div>
  );
}
