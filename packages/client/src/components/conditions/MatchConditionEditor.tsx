import type { MatchCondition } from "@eesimple/types";

import { FIELD_OPTIONS, OPERATOR_OPTIONS } from "./matchOptions";

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

/** Controlled editor for a single text-match condition (operator + field + pattern). */
export function MatchConditionEditor({
  value, onChange,
}: MatchConditionEditorProps) {
  const isDomain = value.operator === "domain";

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
          onValueChange={(operator) => {
            const next = operator as MatchCondition["operator"];
            // `domain` always inspects the URL, so pin the field to keep the data coherent.
            onChange({
              ...value,
              operator: next,
              field: next === "domain" ? "url" : value.field,
            });
          }}
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

      {isDomain
        ? (
          <p className="self-end text-xs text-muted-foreground">
            Matches the bookmark URL’s domain (a leading “www.” is ignored).
          </p>
        )
        : (
          <div className="space-y-1">
            <Label>Field</Label>
            <Select
              value={value.field}
              onValueChange={field =>
                onChange({
                  ...value,
                  field: field as MatchCondition["field"],
                })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map(option => (
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
        )}

      <div
        className="
          space-y-1
          sm:col-span-2
        "
      >
        <Label>{isDomain ? "Domain" : "Pattern"}</Label>
        <Input
          value={value.pattern}
          placeholder={isDomain ? "e.g. 101cookbooks.com" : "e.g. Ponzu"}
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
