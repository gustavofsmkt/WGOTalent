"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  statusConfigMap,
  toneStyles,
  type DomainStatus,
} from "~/components/status-badge";
import { cn } from "~/lib/utils";

export interface EditableStatusBadgeOption<T extends string> {
  value: T;
  label: string;
}

export interface EditableStatusBadgeProps<T extends string> {
  value: T;
  options: readonly EditableStatusBadgeOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function EditableStatusBadge<T extends string>({
  value,
  options,
  onChange,
  disabled,
  ...props
}: EditableStatusBadgeProps<T>) {
  const config =
    value in statusConfigMap ? statusConfigMap[value as DomainStatus] : null;
  const tone = config?.tone ?? "neutral";
  const label =
    config?.label ?? options.find((o) => o.value === value)?.label ?? value;

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (typeof val === "string") {
          onChange(val as T);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={props["aria-label"]}
        className={cn(
          "h-6 gap-1 rounded-4xl border px-2.5 py-0 text-xs font-medium tracking-wide",
          toneStyles[tone],
        )}
      >
        <SelectValue>{() => label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[200px]">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="whitespace-normal break-words">{opt.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
