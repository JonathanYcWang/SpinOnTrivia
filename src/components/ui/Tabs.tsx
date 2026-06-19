import { Button } from "./Button";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div aria-label={ariaLabel} className="flex gap-2" role="tablist">
      {tabs.map((tab) => (
        <Button
          aria-selected={value === tab.value}
          className={
            value === tab.value
              ? "bg-[var(--primary)] !text-[var(--primary-foreground)]"
              : ""
          }
          disabled={disabled}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          role="tab"
          variant={value === tab.value ? "primary" : "secondary"}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
