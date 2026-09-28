import { ReactNode } from "react";
import { Card } from "./card";

export function StatCard({
  label,
  value,
  success = false,
  hint,
}: {
  label: string;
  value: string;
  success?: boolean; // saved-revenue figures render in success green
  hint?: ReactNode;
}) {
  return (
    <Card className="animate-rise">
      <div className="text-sm text-muted">{label}</div>
      <div
        className={`tnum font-display mt-1 text-[40px] font-bold leading-[1.1] ${
          success ? "text-success" : "text-on-surface"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  );
}
