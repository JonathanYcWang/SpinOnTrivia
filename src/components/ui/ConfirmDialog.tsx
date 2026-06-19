"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./Button";

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: ReactNode;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel(): void;
  onConfirm(): void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstButton = dialogRef.current?.querySelector("button");
    firstButton?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;
      const buttons = Array.from(
        dialogRef.current?.querySelectorAll("button") ?? [],
      );
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-8">
      <div
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-muted)]">
          {body}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button onClick={onConfirm} variant={danger ? "danger" : "primary"}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
