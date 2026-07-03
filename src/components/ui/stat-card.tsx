import { Card } from "./card";

export function StatCard({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean; // saved-revenue figures render in success green
}) {
  return (
    <Card>
      <div className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </div>
      <div
        className={`tnum mt-2 text-[40px] font-bold leading-[1.1] tracking-tight ${
          success ? "text-success" : "text-on-surface"
        }`}
      >
        {value}
      </div>
    </Card>
  );
}
