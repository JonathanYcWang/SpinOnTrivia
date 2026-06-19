import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95",
  secondary:
    "border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:brightness-95",
  danger:
    "border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25",
  ghost:
    "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]",
};

export function Button({
  children,
  className = "",
  variant = "secondary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
