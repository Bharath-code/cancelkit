// Single source of truth for exit reasons and pause lengths.
// Twin: convex/constants.ts (Convex can't import from src/ — keep in sync).

export const REASONS = [
  { value: "too_expensive", label: "It's too expensive" },
  { value: "not_using", label: "I'm not using it enough" },
  { value: "missing_features", label: "It's missing features I need" },
  { value: "switching_competitor", label: "I'm switching to something else" },
  { value: "too_difficult", label: "It's too difficult to use" },
  { value: "temporary_pause_needed", label: "I just need a break" },
  { value: "other", label: "Something else" },
] as const;

export type Reason = (typeof REASONS)[number]["value"];

export const REASON_VALUES = REASONS.map((r) => r.value);

export const PAUSE_DAYS = [7, 14, 30, 60] as const;
export const DEFAULT_PAUSE_DAYS = 30;
