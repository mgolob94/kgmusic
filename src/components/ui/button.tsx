import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-sunken",
  ghost: "text-ink-soft hover:bg-sunken hover:text-ink",
  danger: "bg-unexcused-soft text-unexcused border border-unexcused/30 hover:bg-unexcused/15",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-[0.9375rem]",
  sm: "min-h-9 px-3 text-sm",
  icon: "size-11",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
