import type { ReactNode } from "react";
import { FieldError } from "./FieldError";

export function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-sm font-medium text-[var(--foreground)]"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
