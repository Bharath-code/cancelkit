"use client";

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  accent = "#2E4FD1",
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label: string;
  accent?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-2">
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`group flex w-full cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-[border-color,background-color,transform] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              on ? "bg-surface" : "border-border bg-surface hover:bg-mist"
            }`}
            style={on ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : undefined}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={on}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors"
              style={{ borderColor: on ? accent : "#C3CCD8" }}
            >
              <span
                className="h-2 w-2 rounded-full transition-transform duration-150"
                style={{ background: accent, transform: on ? "scale(1)" : "scale(0)" }}
              />
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
