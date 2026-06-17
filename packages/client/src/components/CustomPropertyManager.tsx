import type { Category, CustomProperty, CustomPropertyType } from "@eesimple/types";

import { useState } from "react";

import { PropertyTagManager } from "./PropertyTagManager";
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
  tiered_tags: "Tiered Tags",
  number: "Number",
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

/** Create, list, and delete custom properties; manage each tiered-tags property's tiers. */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const createProperty = useCreateCustomProperty();

  const [name, setName] = useState("");
  const [type, setType] = useState<CustomPropertyType>("tiered_tags");
  const [numberMin, setNumberMin] = useState("0");
  const [numberMax, setNumberMax] = useState("100");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProperty.mutate({
      name: trimmed,
      type,
      numberMin: type === "number" ? Number(numberMin) : null,
      numberMax: type === "number" ? Number(numberMax) : null,
      categoryIds,
    });
    setName("");
    setNumberMin("0");
    setNumberMax("100");
    setCategoryIds([]);
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
                  <SelectItem value="tiered_tags">Tiered Tags</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
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
                      value={numberMin}
                      onChange={event => setNumberMin(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="property-max">Slider maximum</Label>
                    <Input
                      id="property-max"
                      type="number"
                      value={numberMax}
                      onChange={event => setNumberMax(event.target.value)}
                    />
                  </div>
                </>
              )
              : null}
          </div>

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
            disabled={!name.trim() || createProperty.isPending}
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
          />
        ))}
      </div>
    </section>
  );
}

interface PropertyCardProps {
  property: CustomProperty;
  categories: Category[];
}

function PropertyCard({
  property,
  categories,
}: PropertyCardProps) {
  const deleteProperty = useDeleteCustomProperty();
  const updateProperty = useUpdateCustomProperty();

  const assigned = categories.filter(category => property.categoryIds.includes(category.id));

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
              </span>
            )
            : null}
          {assigned.map(category => (
            <Badge
              key={category.id}
              variant="outline"
              className="gap-1"
            >
              <CategoryIcon
                name={category.icon}
                className="size-3"
              />
              {category.name}
            </Badge>
          ))}
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

        {property.type === "tiered_tags"
          ? <PropertyTagManager propertyId={property.id} />
          : null}
      </CardContent>
    </Card>
  );
}
