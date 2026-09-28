import { ReactNode } from "react";

export function OfferCard({
  title,
  terms,
  accent = "#0F1E36",
  icon,
  children,
}: {
  title: string;
  terms: string;
  accent?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 pl-6"
      style={{ boxShadow: `inset 4px 0 0 ${accent}` }}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold leading-snug">{title}</h3>
          <p className="mt-1.5 text-sm text-muted">{terms}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
