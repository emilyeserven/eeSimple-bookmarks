import type { LockedKeys } from "./fillTargetShared";
import type { CustomProperty, FillTarget, RatingLevelDetector } from "@eesimple/types";

import { useId } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "../../Combobox";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { KindSelect, LabeledInput } from "../controls";

import { ratingLevelLabel, ratingLevelValues } from "@/lib/propertyFormat";

type SubField = "current" | "total";

/**
 * Detector editor for a rating target in `ratingBound: "range"` mode. A shared CSS selector + a global
 * "Exact match" toggle (equals vs contains, case-insensitive) sit above one row per scale level; each
 * row has the level's match text (default: its label) and an optional per-level selector override. The
 * engine marks a level present when its effective selector matches an element and, if match text is set,
 * that element's text matches under the global mode. Empty levels are dropped on save
 * (`cleanCustomPropertyTarget`).
 */
function RatingLevelDetectorsEditor({
  property, target, onChange,
}: {
  property: CustomProperty;
  target: Extract<FillTarget, { kind: "customProperty" }>;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  const exactId = useId();
  const caseId = useId();
  const levels = ratingLevelValues(property);
  const existing = target.ratingLevels ?? [];
  const detectorFor = (level: number) => existing.find(detector => detector.level === level);
  const sharedSelector = target.ratingSelector ?? "";
  const exact = target.ratingMatchExact ?? true;
  const caseSensitive = target.ratingMatchCaseSensitive ?? false;
  // A level's own selector override (blank = use the shared selector).
  const selectorDisplay = (level: number) => detectorFor(level)?.selector ?? "";
  // A level's match text: the stored value, else a first-time prefill of the level's label (so the
  // shared selector matches the right level out of the box).
  const matchDisplay = (level: number) => {
    const stored = detectorFor(level);
    return stored ? (stored.matchText ?? "") : ratingLevelLabel(property, level);
  };

  // Rebuild the per-level array from the current displayed values, applying at most one level edit.
  const buildLevels = (editLevel: number | null, patch: { selector?: string;
    matchText?: string; }): RatingLevelDetector[] =>
    levels.map((level) => {
      const selector = level === editLevel && patch.selector !== undefined ? patch.selector : selectorDisplay(level);
      const matchText = level === editLevel && patch.matchText !== undefined ? patch.matchText : matchDisplay(level);
      return {
        level,
        ...(selector.trim() !== ""
          ? {
            selector,
          }
          : {}),
        ...(matchText.trim() !== ""
          ? {
            matchText,
          }
          : {}),
      };
    });

  // Rebuild the whole range target; unspecified fields keep their current displayed value.
  const commit = (fields: { ratingSelector?: string;
    ratingMatchExact?: boolean;
    ratingMatchCaseSensitive?: boolean;
    ratingLevels?: RatingLevelDetector[]; }) => {
    onChange({
      kind: "customProperty",
      propertyId: target.propertyId,
      ratingBound: "range",
      ratingSelector: fields.ratingSelector ?? sharedSelector,
      ratingMatchExact: fields.ratingMatchExact ?? exact,
      ratingMatchCaseSensitive: fields.ratingMatchCaseSensitive ?? caseSensitive,
      ratingLevels: fields.ratingLevels ?? buildLevels(null, {}),
    });
  };

  return (
    <div className="space-y-3 rounded-md border p-2">
      <p className="text-xs text-muted-foreground">
        {t("A shared CSS selector marks each level present when it matches; per-level match text (default: the label) picks which level. A level can override the shared selector.")}
      </p>
      <LabeledInput
        label={t("Selector (shared)")}
        value={sharedSelector}
        placeholder={t("e.g. .difficulty-badge")}
        onChange={ratingSelector => commit({
          ratingSelector,
        })}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id={exactId}
          checked={exact}
          onCheckedChange={checked => commit({
            ratingMatchExact: checked === true,
          })}
        />
        <Label htmlFor={exactId}>{t("Exact match text")}</Label>
        <span className="text-xs text-muted-foreground">{t("Off = \"contains\"")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={caseId}
          checked={caseSensitive}
          onCheckedChange={checked => commit({
            ratingMatchCaseSensitive: checked === true,
          })}
        />
        <Label htmlFor={caseId}>{t("Case sensitive")}</Label>
        <span className="text-xs text-muted-foreground">{t("Off = case-insensitive")}</span>
      </div>
      {levels.map(level => (
        <div
          key={level}
          className="space-y-1"
        >
          <Label className="text-xs font-medium">{ratingLevelLabel(property, level)}</Label>
          <LabeledInput
            label={t("Match text")}
            value={matchDisplay(level)}
            onChange={matchText => commit({
              ratingLevels: buildLevels(level, {
                matchText,
              }),
            })}
          />
          <LabeledInput
            label={t("Selector override (optional)")}
            value={selectorDisplay(level)}
            placeholder={t("Override shared selector")}
            onChange={selector => commit({
              ratingLevels: buildLevels(level, {
                selector,
              }),
            })}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * For a multi-value property, a sub-value selector: Two-Numbers (`itemInItems`) → Current/Total;
 * Choices → which option. Other property types (and while none is selected) render nothing.
 */
export function CustomPropertySubValue({
  target, property, onChange, lockedKeys,
}: {
  target: Extract<FillTarget, { kind: "customProperty" }>;
  property: CustomProperty | undefined;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  if (property?.type === "itemInItems") {
    return (
      <KindSelect<SubField>
        label={t("Value")}
        disabled={lockedKeys.has("customProperty.subField")}
        value={target.subField ?? "current"}
        options={[
          {
            value: "current",
            label: t("Current"),
          },
          {
            value: "total",
            label: t("Total"),
          },
        ]}
        onValueChange={subField => onChange({
          kind: "customProperty",
          propertyId: target.propertyId,
          subField,
        })}
      />
    );
  }
  if (property?.type === "ratingScale" && property.ratingAllowRange) {
    return (
      <div className="space-y-2">
        <KindSelect<"from" | "to" | "range">
          label={t("Range end")}
          value={target.ratingBound ?? "from"}
          options={[
            {
              value: "from",
              label: t("From"),
            },
            {
              value: "to",
              label: t("To"),
            },
            {
              value: "range",
              label: t("Detect range"),
              description: t("Detect which levels are present on the page and set From/To to their min/max."),
            },
          ]}
          onValueChange={ratingBound => onChange({
            kind: "customProperty",
            propertyId: target.propertyId,
            ratingBound,
            ...(ratingBound === "range" && target.ratingLevels
              ? {
                ratingLevels: target.ratingLevels,
              }
              : {}),
          })}
        />
        {target.ratingBound === "range"
          ? (
            <RatingLevelDetectorsEditor
              property={property}
              target={target}
              onChange={onChange}
            />
          )
          : null}
      </div>
    );
  }
  if (property?.type === "choices") {
    return (
      <Combobox
        aria-label={t("Option")}
        disabled={lockedKeys.has("customProperty.choiceValue")}
        options={property.choicesItems.map(item => ({
          value: item.value,
          label: item.label,
        }))}
        value={target.choiceValue || undefined}
        placeholder={t("Select an option")}
        emptyText={t("No options found.")}
        onValueChange={value => onChange({
          kind: "customProperty",
          propertyId: target.propertyId,
          choiceValue: value ?? "",
        })}
      />
    );
  }
  return null;
}
