import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "cancel-ghost" | "marigold";

export const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover disabled:bg-primary-disabled disabled:text-surface",
  secondary:
    "bg-surface text-on-surface border border-border hover:border-ink/30 hover:bg-mist",
  "cancel-ghost": "bg-transparent text-muted hover:text-on-surface underline-offset-4 hover:underline",
  marigold:
    "bg-marigold text-ink hover:bg-[#ffc233] shadow-[0_6px_20px_-6px_rgba(255,180,0,0.6)]",
};

export const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold leading-none transition-[background-color,border-color,transform,box-shadow] duration-150 active:translate-y-px disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}
