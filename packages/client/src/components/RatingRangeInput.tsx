import type { CustomProperty } from "@eesimple/types";
import type { ReactElement } from "react";

import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ratingLevelLabel, ratingLevelValues } from "@/lib/propertyFormat";
import { encodeRatingRange, parseNumberInput } from "@/lib/propertyValues";

/** Sentinel Select value for "no rating" (the SelectItem value can't be an empty string). */
const RATING_RANGE_NONE = "__none__";

/**
 * Two From/To dropdowns for a **range-enabled** `ratingScale`, editing the value through the shared
 * single-string `numberInputs` channel (encoded `"from~to"` — see {@link encodeRatingRange}). Options
 * are the scale's levels, labelled by the property's per-number labels when set. Keeps `To ≥ From`.
 * Shared by the bookmark form (`RatingScalePropertyField`) and `renderPropertyScalarInput`.
 */
export function RatingRangeInput({
  property, raw, onChange,
}: {
  property: CustomProperty;
  raw: string;
  onChange: (value: string) => void;
}): ReactElement {
  const {
    t,
  } = useTranslation();
  const parsed = parseNumberInput(raw);
  const from = parsed?.value ?? null;
  const to = parsed?.valueEnd ?? parsed?.value ?? null;
  const levels = ratingLevelValues(property);

  const setFrom = (next: string) => {
    if (next === RATING_RANGE_NONE) {
      onChange("");
      return;
    }
    const nextFrom = Number(next);
    // Keep To ≥ From.
    const nextTo = to !== null && to > nextFrom ? to : nextFrom;
    onChange(encodeRatingRange(nextFrom, nextTo));
  };
  const setTo = (next: string) => {
    if (from === null) return;
    onChange(encodeRatingRange(from, Number(next)));
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={from === null ? RATING_RANGE_NONE : String(from)}
        onValueChange={setFrom}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("From")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={RATING_RANGE_NONE}>{t("(none)")}</SelectItem>
          {levels.map(level => (
            <SelectItem
              key={level}
              value={String(level)}
            >
              {ratingLevelLabel(property, level)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">{t("to")}</span>
      <Select
        value={to === null ? "" : String(to)}
        disabled={from === null}
        onValueChange={setTo}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("To")} />
        </SelectTrigger>
        <SelectContent>
          {levels
            .filter(level => from === null || level >= from)
            .map(level => (
              <SelectItem
                key={level}
                value={String(level)}
              >
                {ratingLevelLabel(property, level)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
