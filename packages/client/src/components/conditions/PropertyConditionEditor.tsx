import type { Category, CustomProperty, PropertyCondition } from "@eesimple/types";

import { RangeSlider } from "../RangeSlider";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyConditionEditorProps {
  value: PropertyCondition[];
  properties: CustomProperty[];
  categories: Category[];
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
  onChange: (next: PropertyCondition | null) => void;
}

/** A single property's condition control (range/presence for numbers, value/presence for booleans). */
function PropertyConditionRow({
  property, condition, onChange,
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
          <Label className="text-sm">{property.name}</Label>
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
      <Label className="text-sm">{property.name}</Label>
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

/** Custom-property conditions, organized one sub-group per category (plus uncategorized). */
export function PropertyConditionEditor({
  value, properties, categories, onChange,
}: PropertyConditionEditorProps) {
  const byId = new Map(value.map(condition => [condition.propertyId, condition]));

  function setCondition(propertyId: string, condition: PropertyCondition | null) {
    const others = value.filter(current => current.propertyId !== propertyId);
    onChange(condition ? [...others, condition] : others);
  }

  const uncategorized = properties.filter(property => property.categoryIds.length === 0);
  const groups = [
    ...(uncategorized.length > 0
      ? [{
        id: "general",
        name: "General",
        props: uncategorized,
      }]
      : []),
    ...categories
      .map(category => ({
        id: category.id,
        name: category.name,
        props: properties.filter(property => property.categoryIds.includes(category.id)),
      }))
      .filter(group => group.props.length > 0),
  ];

  if (groups.length === 0) {
    return <p className="text-xs text-muted-foreground">No custom properties yet.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div
          key={group.id}
          className="space-y-2"
        >
          <p className="text-xs font-medium text-muted-foreground">{group.name}</p>
          {group.props.map(property => (
            <PropertyConditionRow
              key={`${group.id}-${property.id}`}
              property={property}
              condition={byId.get(property.id)}
              onChange={condition => setCondition(property.id, condition)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
