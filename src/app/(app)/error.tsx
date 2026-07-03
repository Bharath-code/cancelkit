"use client";

// Error state for all authenticated pages (PRD § 8: inline retry, no "Oops").
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">This page hit an error</h2>
      <p className="mt-2 text-sm text-muted">
        {error.message?.includes("unauthenticated")
          ? "Your session expired — reconnect from the landing page."
          : "The data fetch failed — your billing state is untouched. Retry usually fixes it."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-hover"
      >
        Retry
      </button>
    </div>
  );
}
