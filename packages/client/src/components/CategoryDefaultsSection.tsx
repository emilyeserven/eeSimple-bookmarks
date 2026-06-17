import type { Category } from "@eesimple/types";

import { useEffect, useState } from "react";

import {
  useCategoryDefaults,
  useSetCategoryDefaults,
} from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryDefaultsSectionProps {
  category: Category;
}

/**
 * Editor for a category's default custom-property values, applied to new bookmarks added to it.
 * Only properties assigned to this category are shown; calculate properties are computed on save.
 */
export function CategoryDefaultsSection({
  category,
}: CategoryDefaultsSectionProps) {
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: defaults,
  } = useCategoryDefaults(category.id);
  const setDefaults = useSetCategoryDefaults(category.id);

  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({});
  // `undefined` means "no default" — kept distinct from an explicit `false` so a false default saves.
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean | undefined>>({});

  // Seed the inputs from the saved defaults once they load (or change).
  useEffect(() => {
    if (!defaults) return;
    setNumberInputs(Object.fromEntries(
      defaults.numberValues.map(entry => [entry.propertyId, String(entry.value)]),
    ));
    setBooleanInputs(Object.fromEntries(
      defaults.booleanValues.map(entry => [entry.propertyId, entry.value]),
    ));
  }, [defaults]);

  const categoryProps = (properties ?? []).filter(property =>
    property.categoryIds.includes(category.id) && property.type !== "calculate");
  if (categoryProps.length === 0) return null;

  function save() {
    const numberValues = categoryProps
      .filter(property => property.type === "number")
      .map(property => ({
        propertyId: property.id,
        raw: numberInputs[property.id] ?? "",
      }))
      .filter(({
        raw,
      }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
      .map(({
        propertyId, raw,
      }) => ({
        propertyId,
        value: Number(raw),
      }));
    const booleanValues = categoryProps
      .filter(property => property.type === "boolean")
      .map(property => ({
        propertyId: property.id,
        value: booleanInputs[property.id],
      }))
      // Only persist properties given an explicit Yes/No; "No default" is left unset.
      .filter((entry): entry is { propertyId: string;
        value: boolean; } => entry.value !== undefined);
    setDefaults.mutate({
      numberValues,
      booleanValues,
    });
  }

  return (
    <div className="space-y-2">
      <Label>Default property values</Label>
      <p className="text-xs text-muted-foreground">
        Prefilled when you add a bookmark to this category. You can still change them per bookmark.
      </p>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`default-${category.id}-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`default-${category.id}-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event =>
                    setNumberInputs(current => ({
                      ...current,
                      [property.id]: event.target.value,
                    }))}
                />
              </div>
            );
          }
          const current = booleanInputs[property.id];
          const selectValue = current === undefined ? "unset" : String(current);
          return (
            <div
              key={property.id}
              className="space-y-1"
            >
              <Label htmlFor={`default-${category.id}-${property.id}`}>{property.name}</Label>
              <Select
                value={selectValue}
                onValueChange={value =>
                  setBooleanInputs(currentInputs => ({
                    ...currentInputs,
                    [property.id]: value === "unset" ? undefined : value === "true",
                  }))}
              >
                <SelectTrigger id={`default-${category.id}-${property.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">No default</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={save}
      >
        Save defaults
      </Button>
    </div>
  );
}
