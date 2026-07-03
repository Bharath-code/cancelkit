"use client";

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-4 py-2.5 text-sm transition-colors ${
            value === opt.value
              ? "border-accent bg-surface"
              : "border-border bg-surface hover:bg-background"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 accent-[#4353FF]"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
