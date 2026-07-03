import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "cancel-ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover disabled:bg-primary-disabled disabled:text-surface",
  secondary:
    "bg-surface text-on-surface border border-border hover:bg-background",
  "cancel-ghost": "bg-transparent text-muted hover:text-on-surface",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`h-10 rounded-md px-5 py-2.5 text-sm font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
