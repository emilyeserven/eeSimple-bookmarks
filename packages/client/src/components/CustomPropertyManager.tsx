import type { Category, CustomProperty, CustomPropertyType } from "@eesimple/types";

import { useState } from "react";

import { useCategories } from "../hooks/useCategories";
import {
  useCreateCustomProperty,
  useCustomProperties,
  useDeleteCustomProperty,
  useUpdateCustomProperty,
} from "../hooks/useCustomProperties";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CategoryIcon } from "@/lib/icons";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
};

/** Add or remove `id` from `ids`, returning a new array. */
function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

interface CategoryCheckboxListProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  idPrefix: string;
}

/** A checkbox list for assigning a property to zero, one, or many categories. */
function CategoryCheckboxList({
  categories,
  selectedIds,
  onToggle,
  idPrefix,
}: CategoryCheckboxListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No categories yet. Create some on the Categories page.
      </p>
    );
  }
  return (
    <div
      className="
        grid gap-2
        sm:grid-cols-2
      "
    >
      {categories.map((category) => {
        const inputId = `${idPrefix}-${category.id}`;
        return (
          <div
            key={category.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={inputId}
              checked={selectedIds.includes(category.id)}
              onCheckedChange={() => onToggle(category.id)}
            />
            <Label
              htmlFor={inputId}
              className="flex items-center gap-1.5"
            >
              <CategoryIcon
                name={category.icon}
                className="size-3.5"
              />
              {category.name}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

interface OperandCheckboxListProps {
  numberProperties: CustomProperty[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** A checkbox list for choosing the Number properties a Calculate property sums. */
function OperandCheckboxList({
  numberProperties, selectedIds, onToggle,
}: OperandCheckboxListProps) {
  if (numberProperties.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Create at least two Number properties first; a Calculate property sums them.
      </p>
    );
  }
  return (
    <div
      className="
        grid gap-2
        sm:grid-cols-2
      "
    >
      {numberProperties.map((property) => {
        const inputId = `operand-${property.id}`;
        return (
          <div
            key={property.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={inputId}
              checked={selectedIds.includes(property.id)}
              onCheckedChange={() => onToggle(property.id)}
            />
            <Label htmlFor={inputId}>{property.name}</Label>
          </div>
        );
      })}
    </div>
  );
}

/** Create, list, and delete custom properties (Number, Boolean, Calculate). */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const createProperty = useCreateCustomProperty();

  const [name, setName] = useState("");
  const [type, setType] = useState<CustomPropertyType>("number");
  const [numberMin, setNumberMin] = useState("0");
  const [numberMax, setNumberMax] = useState("100");
  const [disableMin, setDisableMin] = useState(false);
  const [disableMax, setDisableMax] = useState(false);
  const [unitSingular, setUnitSingular] = useState("");
  const [unitPlural, setUnitPlural] = useState("");
  const [operandIds, setOperandIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const numberProperties = (properties ?? []).filter(property => property.type === "number");
  const calculateInvalid = type === "calculate" && operandIds.length < 2;

  function reset() {
    setName("");
    setNumberMin("0");
    setNumberMax("100");
    setDisableMin(false);
    setDisableMax(false);
    setUnitSingular("");
    setUnitPlural("");
    setOperandIds([]);
    setCategoryIds([]);
  }

  function create() {
    const trimmed = name.trim();
    if (!trimmed || calculateInvalid) return;
    createProperty.mutate({
      name: trimmed,
      type,
      numberMin: type === "number" && !disableMin ? Number(numberMin) : null,
      numberMax: type === "number" && !disableMax ? Number(numberMax) : null,
      unitSingular: type === "number" ? (unitSingular.trim() || null) : null,
      unitPlural: type === "number" ? (unitPlural.trim() || null) : null,
      operandPropertyIds: type === "calculate" ? operandIds : undefined,
      categoryIds,
    });
    reset();
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New custom property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <div className="space-y-1">
              <Label htmlFor="property-name">Name</Label>
              <Input
                id="property-name"
                placeholder="e.g. Priority"
                value={name}
                onChange={event => setName(event.target.value)}
                onKeyDown={event => event.key === "Enter" && create()}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="property-type">Type</Label>
              <Select
                value={type}
                onValueChange={value => setType(value as CustomPropertyType)}
              >
                <SelectTrigger
                  id="property-type"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="calculate">Calculate (Sum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "number"
              ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="property-min">Slider minimum</Label>
                    <Input
                      id="property-min"
                      type="number"
                      disabled={disableMin}
                      value={disableMin ? "" : numberMin}
                      onChange={event => setNumberMin(event.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="property-disable-min"
                        checked={disableMin}
                        onCheckedChange={checked => setDisableMin(checked === true)}
                      />
                      <Label
                        htmlFor="property-disable-min"
                        className="text-xs text-muted-foreground"
                      >
                        No minimum
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="property-max">Slider maximum</Label>
                    <Input
                      id="property-max"
                      type="number"
                      disabled={disableMax}
                      value={disableMax ? "" : numberMax}
                      onChange={event => setNumberMax(event.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="property-disable-max"
                        checked={disableMax}
                        onCheckedChange={checked => setDisableMax(checked === true)}
                      />
                      <Label
                        htmlFor="property-disable-max"
                        className="text-xs text-muted-foreground"
                      >
                        No maximum
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="property-unit-singular">Unit (singular)</Label>
                    <Input
                      id="property-unit-singular"
                      placeholder="e.g. star"
                      value={unitSingular}
                      onChange={event => setUnitSingular(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="property-unit-plural">Unit (plural)</Label>
                    <Input
                      id="property-unit-plural"
                      placeholder="e.g. stars"
                      value={unitPlural}
                      onChange={event => setUnitPlural(event.target.value)}
                    />
                  </div>
                </>
              )
              : null}
          </div>

          {type === "calculate"
            ? (
              <div className="space-y-2">
                <Label>Operands (summed)</Label>
                <OperandCheckboxList
                  numberProperties={numberProperties}
                  selectedIds={operandIds}
                  onToggle={id => setOperandIds(current => toggleId(current, id))}
                />
                {calculateInvalid
                  ? <p className="text-xs text-destructive">Select at least two Number properties.</p>
                  : null}
              </div>
            )
            : null}

          <div className="space-y-2">
            <Label>Categories</Label>
            <CategoryCheckboxList
              categories={categories ?? []}
              selectedIds={categoryIds}
              onToggle={id => setCategoryIds(current => toggleId(current, id))}
              idPrefix="new-property-category"
            />
          </div>

          <Button
            type="button"
            onClick={create}
            disabled={!name.trim() || calculateInvalid || createProperty.isPending}
          >
            Add property
          </Button>
          {createProperty.isError
            ? <p className="text-sm text-destructive">{createProperty.error.message}</p>
            : null}
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading custom properties…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (properties?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No custom properties yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(properties ?? []).map(property => (
          <PropertyCard
            key={property.id}
            property={property}
            categories={categories ?? []}
            allProperties={properties ?? []}
          />
        ))}
      </div>
    </section>
  );
}

interface PropertyCardProps {
  property: CustomProperty;
  categories: Category[];
  allProperties: CustomProperty[];
}

function PropertyCard({
  property,
  categories,
  allProperties,
}: PropertyCardProps) {
  const deleteProperty = useDeleteCustomProperty();
  const updateProperty = useUpdateCustomProperty();

  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  function toggleCategory(id: string) {
    updateProperty.mutate({
      id: property.id,
      input: {
        categoryIds: toggleId(property.categoryIds, id),
      },
    });
  }

  return (
    <Card>
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
      >
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{property.name}</CardTitle>
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
          {property.type === "number"
            ? (
              <span className="text-xs text-muted-foreground">
                {`${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`}
                {property.unitPlural ? ` ${property.unitPlural}` : ""}
              </span>
            )
            : null}
          {property.type === "calculate" && operandNames.length > 0
            ? <span className="text-xs text-muted-foreground">{`Σ ${operandNames.join(" + ")}`}</span>
            : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => deleteProperty.mutate(property.id)}
        >
          Delete
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Categories</Label>
          <CategoryCheckboxList
            categories={categories}
            selectedIds={property.categoryIds}
            onToggle={toggleCategory}
            idPrefix={`property-category-${property.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
