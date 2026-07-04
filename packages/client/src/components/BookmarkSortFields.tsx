import type { BookmarkSort, SortDirection, CustomProperty } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { RANDOM_FIELD, sortFieldOptions } from "../lib/bookmarkSort";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface SortDimensionRowProps {
  fieldOptions: { value: string;
    label: string; }[];
  field: string | null;
  direction: SortDirection;
  placeholder: string;
  showDirection?: boolean;
  onFieldChange: (field: string | null) => void;
  onDirectionChange: (dir: SortDirection) => void;
}

export function SortDimensionRow({
  fieldOptions,
  field,
  direction,
  placeholder,
  showDirection = true,
  onFieldChange,
  onDirectionChange,
}: SortDimensionRowProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Select
        value={field ?? ""}
        onValueChange={v => onFieldChange(v === "" ? null : v)}
      >
        <SelectTrigger
          size="sm"
          className="min-w-36 flex-1"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {fieldOptions.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {field != null && showDirection && (
        <ToggleGroup
          type="single"
          size="sm"
          value={direction}
          onValueChange={(v) => { if (v) onDirectionChange(v as SortDirection); }}
        >
          <ToggleGroupItem
            value="asc"
            aria-label={t("Ascending")}
          >
            {t("Asc")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="desc"
            aria-label={t("Descending")}
          >
            {t("Desc")}
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  );
}

interface BookmarkSortEditorProps {
  value: BookmarkSort | undefined;
  onChange: (sort: BookmarkSort | undefined) => void;
  properties: CustomProperty[];
  /** Offer "Random" as a primary-field choice, with a "Shuffle again" reroll button. */
  allowRandom?: boolean;
}

/**
 * Primary/secondary sort-dimension pickers over a `BookmarkSort`, shared by the Listings page Sort
 * popover (`BookmarkSortPopover`) and the homepage section form's Sorting field.
 */
export function BookmarkSortEditor({
  value, onChange, properties, allowRandom,
}: BookmarkSortEditorProps) {
  const {
    t,
  } = useTranslation();
  const isRandom = value != null && "random" in value;
  const fieldsSort = value && !isRandom ? value : undefined;

  const fieldOptions = sortFieldOptions(properties, {
    includeRandom: allowRandom,
  });

  const primaryField = isRandom ? RANDOM_FIELD : fieldsSort?.primary.field ?? null;
  const primaryDir = fieldsSort?.primary.direction ?? "asc";
  const secondaryField = fieldsSort?.secondary?.field ?? null;
  const secondaryDir = fieldsSort?.secondary?.direction ?? "asc";

  function setPrimary(field: string | null, direction: SortDirection = primaryDir) {
    if (!field) {
      onChange(undefined);
      return;
    }
    if (field === RANDOM_FIELD) {
      onChange({
        random: true,
        seed: Math.random(),
      });
      return;
    }
    onChange({
      primary: {
        field,
        direction,
      },
      secondary: fieldsSort?.secondary,
    });
  }

  function setPrimaryDir(direction: SortDirection) {
    if (!fieldsSort) return;
    onChange({
      primary: {
        field: fieldsSort.primary.field,
        direction,
      },
      secondary: fieldsSort.secondary,
    });
  }

  function setSecondary(field: string | null, direction: SortDirection = secondaryDir) {
    if (!fieldsSort) return;
    onChange({
      primary: fieldsSort.primary,
      secondary: field
        ? {
          field,
          direction,
        }
        : undefined,
    });
  }

  function setSecondaryDir(direction: SortDirection) {
    if (!fieldsSort || !secondaryField) return;
    onChange({
      primary: fieldsSort.primary,
      secondary: {
        field: secondaryField,
        direction,
      },
    });
  }

  function reshuffle() {
    onChange({
      random: true,
      seed: Math.random(),
    });
  }

  const secondaryOptions = fieldOptions.filter(
    o => o.value !== primaryField && o.value !== RANDOM_FIELD,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{t("Primary")}</span>
        <SortDimensionRow
          fieldOptions={fieldOptions}
          field={primaryField}
          direction={primaryDir}
          placeholder={t("Default order")}
          showDirection={!isRandom}
          onFieldChange={field => setPrimary(field)}
          onDirectionChange={dir => setPrimaryDir(dir)}
        />
      </div>

      {primaryField != null && !isRandom && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("Secondary")}</span>
          <SortDimensionRow
            fieldOptions={secondaryOptions}
            field={secondaryField}
            direction={secondaryDir}
            placeholder={t("None")}
            onFieldChange={field => setSecondary(field)}
            onDirectionChange={dir => setSecondaryDir(dir)}
          />
        </div>
      )}

      {value != null && (
        <div className="flex gap-2">
          {isRandom && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reshuffle}
            >
              {t("Shuffle again")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
          >
            {t("Clear sort")}
          </Button>
        </div>
      )}
    </div>
  );
}
