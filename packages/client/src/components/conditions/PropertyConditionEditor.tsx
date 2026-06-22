import type { Category, CustomProperty, PropertyCondition } from "@eesimple/types";
import type { ReactNode } from "react";

import { ChevronDown, CircleHelp } from "lucide-react";

import { propertyValueKind } from "../../lib/propertyConditionKind";
import { DateTimeRangeFields } from "../DateTimePicker";
import { RangeSlider } from "../RangeSlider";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PropertyConditionEditorProps {
  value: PropertyCondition[];
  properties: CustomProperty[];
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (next: PropertyCondition[]) => void;
}

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

const NUMBER_MODES = [
  {
    value: "none",
    label: "Any",
  },
  {
    value: "range",
    label: "In range",
  },
  {
    value: "has",
    label: "Has value",
  },
  {
    value: "missing",
    label: "Missing",
  },
];

const DATETIME_MODES = [
  {
    value: "none",
    label: "Any",
  },
  {
    value: "range",
    label: "In range",
  },
  {
    value: "has",
    label: "Has value",
  },
  {
    value: "missing",
    label: "Missing",
  },
];

const FILE_MODES = [
  {
    value: "none",
    label: "Any",
  },
  {
    value: "has",
    label: "Has value",
  },
  {
    value: "missing",
    label: "Missing",
  },
];

const BOOLEAN_MODES = [
  {
    value: "none",
    label: "Any",
  },
  {
    value: "yes",
    label: "Yes",
  },
  {
    value: "no",
    label: "No",
  },
  {
    value: "has",
    label: "Has value",
  },
  {
    value: "missing",
    label: "Missing",
  },
];

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
                aria-label="Associated categories"
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
      modes={NUMBER_MODES}
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
      modes={DATETIME_MODES}
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
      modes={FILE_MODES}
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
      modes={BOOLEAN_MODES}
      onModeChange={handleMode}
    />
  );
}

/** A single property's condition control, dispatched to the editor for its value kind. */
function PropertyConditionRow(props: RowProps) {
  switch (propertyValueKind(props.property)) {
    case "number":
      return <NumberConditionRow {...props} />;
    case "datetime":
      return <DateTimeConditionRow {...props} />;
    case "file":
      return <FileConditionRow {...props} />;
    case "boolean":
      return <BooleanConditionRow {...props} />;
  }
}

/** Custom-property conditions as a flat list, with a collapsible "Other Properties" section for properties not assigned to the active category filter. */
export function PropertyConditionEditor({
  value, properties, categories, selectedCategoryIds, onChange,
}: PropertyConditionEditorProps) {
  const byId = new Map(value.map(condition => [condition.propertyId, condition]));

  function setCondition(propertyId: string, condition: PropertyCondition | null) {
    const others = value.filter(current => current.propertyId !== propertyId);
    onChange(condition ? [...others, condition] : others);
  }

  function isPropertyActive(property: CustomProperty): boolean {
    if (!selectedCategoryIds.length) return true;
    if (property.allCategories || property.categoryIds.length === 0) return true;
    return property.categoryIds.some(id => selectedCategoryIds.includes(id));
  }

  const enabledProperties = properties.filter(p => p.enabled);
  const activeProperties = enabledProperties.filter(isPropertyActive);
  const categoryInactiveProperties = enabledProperties.filter(p => !isPropertyActive(p));

  if (enabledProperties.length === 0) {
    return <p className="text-xs text-muted-foreground">No custom properties yet.</p>;
  }

  function renderConditionRows(props: typeof activeProperties) {
    return (
      <div className="space-y-2">
        {props.map(property => (
          <PropertyConditionRow
            key={property.id}
            property={property}
            condition={byId.get(property.id)}
            categories={categories}
            onChange={condition => setCondition(property.id, condition)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeProperties.length > 0 ? renderConditionRows(activeProperties) : null}

      {categoryInactiveProperties.length > 0
        ? (
          <Collapsible className="group/disabled">
            <CollapsibleTrigger
              className="
                flex w-full items-center gap-1.5 text-xs text-muted-foreground
                hover:text-foreground
              "
            >
              <ChevronDown
                className="
                  size-3 shrink-0 transition-transform
                  group-data-[state=open]/disabled:rotate-180
                "
              />
              Other Properties
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                These properties are not assigned to the selected categories and are unlikely to affect the results.
              </p>
              {renderConditionRows(categoryInactiveProperties)}
            </CollapsibleContent>
          </Collapsible>
        )
        : null}
    </div>
  );
}
