import type { Category, CustomProperty, PropertyCondition, SectionEntryType } from "@eesimple/types";
import type { ReactNode } from "react";

import { SECTION_ENTRY_TYPE_LABELS, SECTION_ENTRY_TYPES } from "@eesimple/types";
import { CircleHelp } from "lucide-react";

import { propertyValueKind } from "../../lib/propertyConditionKind";
import { DateTimeRangeFields } from "../DateTimePicker";
import { RangeSlider } from "../RangeSlider";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import i18n from "@/i18n";

/** Slider bounds for a number/calculate/rating property, falling back to a sane default span. */
function numberBounds(property: CustomProperty): [number, number] {
  if (property.type === "ratingScale") {
    return [property.ratingAllowZero ? 0 : 1, property.ratingMax ?? 5];
  }
  const min = property.numberMin ?? 0;
  const max = property.numberMax ?? 100;
  return [min, max > min ? max : min + 1];
}

/** Slider step; rating scales step by half when half ratings are allowed. */
function numberStep(property: CustomProperty): number {
  return property.type === "ratingScale" && property.ratingAllowHalf ? 0.5 : 1;
}

function numberModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "range",
      label: i18n.t("In range"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
  ];
}

function dateTimeModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "range",
      label: i18n.t("In range"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
  ];
}

function fileModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
  ];
}

function booleanModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "yes",
      label: i18n.t("Yes"),
    },
    {
      value: "no",
      label: i18n.t("No"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
  ];
}

interface RowProps {
  property: CustomProperty;
  condition: PropertyCondition | undefined;
  categories: Category[];
  onChange: (next: PropertyCondition | null) => void;
}

function PropertyNameLabel({
  property, categories,
}: { property: CustomProperty;
  categories: Category[]; }) {
  const categoryName = new Map(categories.map(c => [c.id, c.name]));
  return (
    <div className="flex items-center gap-1">
      <Label className="text-sm">{property.name}</Label>
      {categories.length > 0 && property.categoryIds.length > 0
        ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={i18n.t("Associated categories")}
                className="
                  shrink-0 text-muted-foreground
                  hover:text-foreground
                "
              >
                <CircleHelp className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {property.categoryIds.map(id => categoryName.get(id) ?? id).join(", ")}
            </TooltipContent>
          </Tooltip>
        )
        : null}
    </div>
  );
}

interface ModeOption {
  value: string;
  label: string;
}

interface ModeRowProps {
  property: CustomProperty;
  categories: Category[];
  mode: string;
  modes: ModeOption[];
  onModeChange: (next: string) => void;
  /** Extra control rendered below the mode select (range slider / datetime fields). Omit for
   * presence-only kinds — its presence is what switches the row to the stacked `space-y-2` layout. */
  children?: ReactNode;
}

/** Shared row chrome: the property name label + the mode `Select`, with an optional control below. */
function PropertyConditionModeRow({
  property, categories, mode, modes, onModeChange, children,
}: ModeRowProps) {
  const row = (
    <div className="flex items-center justify-between gap-2">
      <PropertyNameLabel
        property={property}
        categories={categories}
      />
      <Select
        value={mode}
        onValueChange={onModeChange}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {modes.map(option => (
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

  if (children === undefined) return row;
  return (
    <div className="space-y-2">
      {row}
      {children}
    </div>
  );
}

/** Number/calculate/rating: a range slider (when "In range") plus presence modes. */
function NumberConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const bounds = numberBounds(property);
  const predicate = condition?.predicate.valueKind === "number" ? condition.predicate.predicate : undefined;
  const mode = predicate ? predicate.kind === "range" ? "range" : predicate.mode : "none";
  const range: [number, number] = predicate?.kind === "range"
    ? [predicate.min ?? bounds[0], predicate.max ?? bounds[1]]
    : bounds;

  function handleMode(next: string): void {
    if (next === "none") onChange(null);
    else if (next === "range") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: bounds[0],
            max: bounds[1],
          },
        },
      });
    }
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "number",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={numberModes()}
      onModeChange={handleMode}
    >
      {mode === "range"
        ? (
          <RangeSlider
            min={bounds[0]}
            max={bounds[1]}
            step={numberStep(property)}
            value={range}
            onValueChange={next =>
              onChange({
                type: "property",
                propertyId: property.id,
                predicate: {
                  valueKind: "number",
                  predicate: {
                    kind: "range",
                    min: next[0],
                    max: next[1],
                  },
                },
              })}
          />
        )
        : null}
    </PropertyConditionModeRow>
  );
}

/** Datetime: a from/to range (when "In range") plus presence modes. */
function DateTimeConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const format = property.dateTimeFormat ?? "date";
  const predicate = condition?.predicate.valueKind === "datetime" ? condition.predicate.predicate : undefined;
  const mode = predicate ? predicate.kind === "range" ? "range" : predicate.mode : "none";
  const range = predicate?.kind === "range"
    ? {
      from: predicate.from,
      to: predicate.to,
    }
    : {
      from: null,
      to: null,
    };

  function emitRange(next: { from: string | null;
    to: string | null; }): void {
    onChange({
      type: "property",
      propertyId: property.id,
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "range",
          from: next.from,
          to: next.to,
        },
      },
    });
  }

  function handleMode(next: string): void {
    if (next === "none") onChange(null);
    else if (next === "range") emitRange(range);
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "datetime",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={dateTimeModes()}
      onModeChange={handleMode}
    >
      {mode === "range"
        ? (
          <DateTimeRangeFields
            format={format}
            from={range.from}
            to={range.to}
            layout="grid"
            onChange={emitRange}
          />
        )
        : null}
    </PropertyConditionModeRow>
  );
}

/** Image/file values are blobs, so only their presence can be matched. */
function FileConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const filePredicate = condition?.predicate.valueKind === "file" ? condition.predicate.predicate : undefined;
  const mode = filePredicate ? filePredicate.mode : "none";

  function handleMode(next: string): void {
    if (next === "none") onChange(null);
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "file",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={fileModes()}
      onModeChange={handleMode}
    />
  );
}

/** Boolean: explicit Yes/No value plus presence modes. */
function BooleanConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const predicate = condition?.predicate.valueKind === "boolean" ? condition.predicate.predicate : undefined;
  const mode = predicate
    ? predicate.kind === "value" ? predicate.value ? "yes" : "no" : predicate.mode
    : "none";

  function handleMode(next: string): void {
    if (next === "none") onChange(null);
    else if (next === "yes" || next === "no") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "boolean",
          predicate: {
            kind: "value",
            value: next === "yes",
          },
        },
      });
    }
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "boolean",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={booleanModes()}
      onModeChange={handleMode}
    />
  );
}

function choicesModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
    {
      value: "includes",
      label: i18n.t("Includes"),
    },
  ];
}

/** Choices: presence modes + an "Includes" multi-select list. */
function ChoicesConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const predicate = condition?.predicate.valueKind === "choices" ? condition.predicate.predicate : undefined;
  const mode = predicate
    ? predicate.kind === "includes" ? "includes" : predicate.mode
    : "none";
  const selectedValues: string[] = predicate?.kind === "includes" ? predicate.values : [];

  function handleMode(next: string): void {
    if (next === "none") {
      onChange(null);
    }
    else if (next === "includes") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "choices",
          predicate: {
            kind: "includes",
            values: [],
          },
        },
      });
    }
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "choices",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  function toggleValue(value: string): void {
    const next = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange({
      type: "property",
      propertyId: property.id,
      predicate: {
        valueKind: "choices",
        predicate: {
          kind: "includes",
          values: next,
        },
      },
    });
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={choicesModes()}
      onModeChange={handleMode}
    >
      {mode === "includes" && property.choicesItems.length > 0
        ? (
          <div className="space-y-1 pl-1">
            {property.choicesItems.map(item => (
              <div
                key={item.value}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`choices-cond-${property.id}-${item.value}`}
                  checked={selectedValues.includes(item.value)}
                  onCheckedChange={() => toggleValue(item.value)}
                />
                <Label
                  htmlFor={`choices-cond-${property.id}-${item.value}`}
                  className="text-sm font-normal"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        )
        : null}
    </PropertyConditionModeRow>
  );
}

function sectionsModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "has",
      label: i18n.t("Has sections"),
    },
    {
      value: "missing",
      label: i18n.t("No sections"),
    },
    {
      value: "sectionType",
      label: i18n.t("By section type"),
    },
    {
      value: "exhaustive",
      label: i18n.t("Exhaustive"),
    },
  ];
}

/** Sections: presence, exhaustive toggle, or section-type multi-select. */
function SectionsConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const predicate = condition?.predicate.valueKind === "sections" ? condition.predicate.predicate : undefined;
  const mode = predicate
    ? predicate.kind === "presence" ? predicate.mode : predicate.kind
    : "none";
  const selectedTypes: SectionEntryType[] = predicate?.kind === "sectionType" ? predicate.types : [];
  const exhaustiveValue = predicate?.kind === "exhaustive" ? predicate.value : true;

  function handleMode(next: string): void {
    if (next === "none") {
      onChange(null);
    }
    else if (next === "has" || next === "missing") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "sections",
          predicate: {
            kind: "presence",
            mode: next,
          },
        },
      });
    }
    else if (next === "sectionType") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "sections",
          predicate: {
            kind: "sectionType",
            types: [],
          },
        },
      });
    }
    else if (next === "exhaustive") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "sections",
          predicate: {
            kind: "exhaustive",
            value: true,
          },
        },
      });
    }
  }

  function toggleType(type: SectionEntryType): void {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onChange({
      type: "property",
      propertyId: property.id,
      predicate: {
        valueKind: "sections",
        predicate: {
          kind: "sectionType",
          types: next,
        },
      },
    });
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={sectionsModes()}
      onModeChange={handleMode}
    >
      {mode === "sectionType"
        ? (
          <div className="space-y-1 pl-1">
            {SECTION_ENTRY_TYPES.map(type => (
              <div
                key={type}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`sections-cond-${property.id}-${type}`}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                />
                <Label
                  htmlFor={`sections-cond-${property.id}-${type}`}
                  className="text-sm font-normal"
                >
                  {SECTION_ENTRY_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </div>
        )
        : mode === "exhaustive"
          ? (
            <div className="pl-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`sections-cond-${property.id}-exhaustive`}
                  checked={exhaustiveValue}
                  onCheckedChange={checked =>
                    onChange({
                      type: "property",
                      propertyId: property.id,
                      predicate: {
                        valueKind: "sections",
                        predicate: {
                          kind: "exhaustive",
                          value: Boolean(checked),
                        },
                      },
                    })}
                />
                <Label
                  htmlFor={`sections-cond-${property.id}-exhaustive`}
                  className="text-sm font-normal"
                >
                  {i18n.t("Is exhaustive")}
                </Label>
              </div>
            </div>
          )
          : null}
    </PropertyConditionModeRow>
  );
}

function textModes() {
  return [
    {
      value: "none",
      label: i18n.t("Any"),
    },
    {
      value: "has",
      label: i18n.t("Has value"),
    },
    {
      value: "missing",
      label: i18n.t("Missing"),
    },
    {
      value: "contains",
      label: i18n.t("Contains"),
    },
  ];
}

/** Text: presence modes plus a free-text "Contains" pattern input. */
function TextConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const predicate = condition?.predicate.valueKind === "text" ? condition.predicate.predicate : undefined;
  const mode = predicate ? predicate.kind === "contains" ? "contains" : predicate.mode : "none";
  const pattern = predicate?.kind === "contains" ? predicate.pattern : "";

  function handleMode(next: string): void {
    if (next === "none") {
      onChange(null);
    }
    else if (next === "contains") {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "text",
          predicate: {
            kind: "contains",
            pattern: "",
          },
        },
      });
    }
    else {
      onChange({
        type: "property",
        propertyId: property.id,
        predicate: {
          valueKind: "text",
          predicate: {
            kind: "presence",
            mode: next as "has" | "missing",
          },
        },
      });
    }
  }

  return (
    <PropertyConditionModeRow
      property={property}
      categories={categories}
      mode={mode}
      modes={textModes()}
      onModeChange={handleMode}
    >
      {mode === "contains"
        ? (
          <Input
            type="text"
            placeholder={i18n.t("Pattern…")}
            value={pattern}
            onChange={e =>
              onChange({
                type: "property",
                propertyId: property.id,
                predicate: {
                  valueKind: "text",
                  predicate: {
                    kind: "contains",
                    pattern: e.target.value,
                  },
                },
              })}
          />
        )
        : null}
    </PropertyConditionModeRow>
  );
}

/** A single property's condition control, dispatched to the editor for its value kind. */
export function PropertyConditionRow(props: RowProps) {
  switch (propertyValueKind(props.property)) {
    case "number":
      return <NumberConditionRow {...props} />;
    case "datetime":
      return <DateTimeConditionRow {...props} />;
    case "file":
      return <FileConditionRow {...props} />;
    case "boolean":
      return <BooleanConditionRow {...props} />;
    case "choices":
      return <ChoicesConditionRow {...props} />;
    case "sections":
      return <SectionsConditionRow {...props} />;
    case "text":
      return <TextConditionRow {...props} />;
  }
}
