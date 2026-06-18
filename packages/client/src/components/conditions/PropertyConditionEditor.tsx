import type { Category, CustomProperty, PropertyCondition } from "@eesimple/types";

import { ChevronDown, CircleHelp } from "lucide-react";

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

/** Slider bounds for a number/calculate property, falling back to a sane default span. */
function numberBounds(property: CustomProperty): [number, number] {
  const min = property.numberMin ?? 0;
  const max = property.numberMax ?? 100;
  return [min, max > min ? max : min + 1];
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

/** A single property's condition control (range/presence for numbers, value/presence for booleans). */
function PropertyConditionRow({
  property, condition, categories, onChange,
}: RowProps) {
  const isNumber = property.type === "number" || property.type === "calculate";

  if (isNumber) {
    const bounds = numberBounds(property);
    const predicate = condition?.predicate.valueKind === "number" ? condition.predicate.predicate : undefined;
    const mode = predicate ? predicate.kind === "range" ? "range" : predicate.mode : "none";
    const range: [number, number] = predicate?.kind === "range"
      ? [predicate.min ?? bounds[0], predicate.max ?? bounds[1]]
      : bounds;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <PropertyNameLabel
            property={property}
            categories={categories}
          />
          <Select
            value={mode}
            onValueChange={(next) => {
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
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_MODES.map(option => (
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
        {mode === "range"
          ? (
            <RangeSlider
              min={bounds[0]}
              max={bounds[1]}
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
      </div>
    );
  }

  const predicate = condition?.predicate.valueKind === "boolean" ? condition.predicate.predicate : undefined;
  const mode = predicate
    ? predicate.kind === "value" ? predicate.value ? "yes" : "no" : predicate.mode
    : "none";

  return (
    <div className="flex items-center justify-between gap-2">
      <PropertyNameLabel
        property={property}
        categories={categories}
      />
      <Select
        value={mode}
        onValueChange={(next) => {
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
        }}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BOOLEAN_MODES.map(option => (
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

  return (
    <div className="space-y-4">
      {activeProperties.length > 0
        ? (
          <div className="space-y-2">
            {activeProperties.map(property => (
              <PropertyConditionRow
                key={property.id}
                property={property}
                condition={byId.get(property.id)}
                categories={categories}
                onChange={condition => setCondition(property.id, condition)}
              />
            ))}
          </div>
        )
        : null}

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
              <div className="space-y-2">
                {categoryInactiveProperties.map(property => (
                  <PropertyConditionRow
                    key={property.id}
                    property={property}
                    condition={byId.get(property.id)}
                    categories={categories}
                    onChange={condition => setCondition(property.id, condition)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
        : null}
    </div>
  );
}
