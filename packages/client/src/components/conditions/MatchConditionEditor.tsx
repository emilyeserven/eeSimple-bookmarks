import type { MatchCondition } from "@eesimple/types";

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
              field: "title",
              operator: operator as MatchCondition["operator"],
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
          value={value.pattern}
          placeholder="e.g. Ponzu"
          onChange={event =>
            onChange({
              ...value,
              pattern: event.target.value,
            })}
        />
      </div>
    </div>
  );
}
