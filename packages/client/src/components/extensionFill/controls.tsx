import type { ReactNode } from "react";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** One option for a {@link KindSelect}. `description` (optional) shows as muted subtext. */
export interface KindOption<T extends string> {
  value: T;
  label: string;
  /** Muted one-line explanation shown under the option in the dropdown and under the select. */
  description?: string;
}

/** A labeled shadcn `Select` bound to a string-literal union (the discriminated-union `kind`s). */
export function KindSelect<T extends string>({
  label, value, options, onValueChange, className, disabled,
}: {
  label: string;
  value: T;
  options: KindOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  /** When true the control is read-only (used when a fill-rule group overrides this option). */
  disabled?: boolean;
}) {
  const id = useId();
  const selectedDescription = options.find(option => option.value === value)?.description;
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={next => onValueChange(next as T)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              description={option.description}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedDescription
        ? <p className="text-xs text-muted-foreground">{selectedDescription}</p>
        : null}
    </div>
  );
}

/** A labeled text `Input`, with optional muted `hint` help text shown under the field. */
export function LabeledInput({
  label, value, onChange, placeholder, className, hint, disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  hint?: ReactNode;
  /** When true the input is read-only (used when a fill-rule group overrides this option). */
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      />
      {hint
        ? <p className="text-xs text-muted-foreground">{hint}</p>
        : null}
    </div>
  );
}

/** A labeled numeric `Input` emitting `number | undefined` (blank / invalid → `undefined`). */
export function LabeledNumberInput({
  label, value, onChange, placeholder, className,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value === undefined ? "" : String(value)}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value.trim();
          const parsed = Number(raw);
          onChange(raw === "" || !Number.isFinite(parsed) ? undefined : parsed);
        }}
      />
    </div>
  );
}
