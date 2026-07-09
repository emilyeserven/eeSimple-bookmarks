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

/** One `{ value, label }` option for a {@link KindSelect}. */
export interface KindOption<T extends string> {
  value: T;
  label: string;
}

/** A labeled shadcn `Select` bound to a string-literal union (the discriminated-union `kind`s). */
export function KindSelect<T extends string>({
  label, value, options, onValueChange, className,
}: {
  label: string;
  value: T;
  options: KindOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={next => onValueChange(next as T)}
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
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A labeled text `Input`. */
export function LabeledInput({
  label, value, onChange, placeholder, className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
      />
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
