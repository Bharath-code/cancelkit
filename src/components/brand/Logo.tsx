// The mark: an exit path that stays open, and a loop that brings some back.
export function LogoMark({ className = "h-6 w-6", onInk = false }: { className?: string; onInk?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M2.5 16.5H20"
        stroke={onInk ? "#7C8A9E" : "#A3B0C2"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M17.5 13.5l3 3-3 3" stroke={onInk ? "#7C8A9E" : "#A3B0C2"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M11 16.5C11 7 21 5.5 20 11.5C19.3 15 13 12 6.5 7.5"
        stroke="#0B9A6D"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="11" cy="16.5" r="2.6" fill="#FFB400" />
    </svg>
  );
}

export function Logo({ onInk = false }: { onInk?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${onInk ? "text-white" : "text-ink"}`}>
      <LogoMark onInk={onInk} />
      <span className="font-display text-[19px] font-bold tracking-tight">CancelKit</span>
    </span>
  );
}
