import type { ReactNode } from "react";

import { ALL_CATEGORIES } from "../lib/autofillScope";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacetSelectProps {
  /** Plural noun used in the trigger / "All …" item, e.g. "websites". */
  label: string;
  /** The current selection (a slug or a sentinel), or undefined for "All". */
  value: string | undefined;
  options: { value: string;
    label: string; }[];
  /** Called with the new value, or undefined when "All …" is chosen. */
  onChange: (value: string | undefined) => void;
  loading?: boolean;
  /** Extra items rendered above the entity options (e.g. a "No category" item). */
  children?: ReactNode;
}

/**
 * A single-select facet filter dropdown. The "All …" item maps to `undefined` (no filter); every other
 * value is passed through verbatim, so callers can use either slugs (URL-persisted) or ids (ephemeral).
 */
export function FacetSelect({
  label, value, options, onChange, loading, children,
}: FacetSelectProps) {
  return (
    <Select
      value={value ?? ALL_CATEGORIES}
      onValueChange={next => onChange(next === ALL_CATEGORIES ? undefined : next)}
    >
      <SelectTrigger
        aria-label={`Filter by ${label}`}
        className="w-48"
      >
        <SelectValue placeholder={loading ? "Loading…" : `All ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>All {label}</SelectItem>
        {children}
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
  );
}
