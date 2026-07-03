import { ReactNode } from "react";

export function OfferCard({
  title,
  terms,
  children,
}: {
  title: string;
  terms: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{terms}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
