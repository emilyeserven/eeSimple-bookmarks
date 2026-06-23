import type { MatchCondition } from "@eesimple/types";

import { useEffect, useState } from "react";

import { OPERATOR_OPTIONS } from "./matchOptions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchConditionEditorProps {
  value: MatchCondition;
  onChange: (next: MatchCondition) => void;
}

/**
 * Controlled editor for a single Title / Name text-match condition (operator + pattern). The
 * matched field is pinned to `title`; website matching lives in its own condition
 * (see `WebsiteConditionEditor`).
 */
export function MatchConditionEditor({
  value, onChange,
}: MatchConditionEditorProps) {
  const [localPattern, setLocalPattern] = useState(value.pattern);

  useEffect(() => {
    setLocalPattern(value.pattern);
  }, [value.pattern]);

  return (
    <div
      className="
        grid gap-3
        sm:grid-cols-2
      "
    >
      <div className="space-y-1">
        <Label>Match</Label>
        <Select
          value={value.operator}
          onValueChange={operator =>
            onChange({
              ...value,
              operator: operator as MatchCondition["operator"],
              pattern: localPattern,
            })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATOR_OPTIONS.map(option => (
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

      <div
        className="
          space-y-1
          sm:col-span-2
        "
      >
        <Label>Pattern</Label>
        <Input
          value={localPattern}
          placeholder="e.g. Ponzu"
          onChange={event => setLocalPattern(event.target.value)}
          onBlur={() => {
            if (localPattern !== value.pattern) {
              onChange({
                ...value,
                pattern: localPattern,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
