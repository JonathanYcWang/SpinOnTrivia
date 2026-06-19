import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
