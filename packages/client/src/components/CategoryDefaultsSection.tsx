import type { Category } from "@eesimple/types";

import { useEffect, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";

import { CategoryDefaultField } from "./CategoryDefaultField";
import {
  useCategoryDefaults,
  useSetCategoryDefaults,
} from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { buildNumberValuesFromInputs } from "../lib/propertyValues";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>({});

  // Seed the inputs from the saved defaults once they load (or change).
  useEffect(() => {
    if (!defaults) return;
    setNumberInputs(Object.fromEntries(
      defaults.numberValues.map(entry => [entry.propertyId, String(entry.value)]),
    ));
    setBooleanInputs(Object.fromEntries(
      defaults.booleanValues.map(entry => [entry.propertyId, entry.value]),
    ));
    setDateTimeInputs(Object.fromEntries(
      defaults.dateTimeValues.map(entry => [entry.propertyId, entry.value]),
    ));
  }, [defaults]);

  const categoryProps = (properties ?? []).filter(property =>
    propertyAppliesToCategory(property, category.id)
    && property.type !== "calculate"
    && property.allowDefault !== false);
  if (categoryProps.length === 0) return null;

  function save() {
    const numberValues = buildNumberValuesFromInputs(categoryProps, numberInputs);
    const booleanValues = categoryProps
      .filter(property => property.type === "boolean")
      .map(property => ({
        propertyId: property.id,
        value: booleanInputs[property.id],
      }))
      // Only persist properties given an explicit Yes/No; "No default" is left unset.
      .filter((entry): entry is { propertyId: string;
        value: boolean; } => entry.value !== undefined);
    const dateTimeValues = categoryProps
      .filter(property => property.type === "datetime")
      .map(property => ({
        propertyId: property.id,
        value: (dateTimeInputs[property.id] ?? "").trim(),
      }))
      .filter(entry => entry.value !== "");
    setDefaults.mutate({
      numberValues,
      booleanValues,
      dateTimeValues,
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
        {categoryProps.map(property => (
          <CategoryDefaultField
            key={property.id}
            category={category}
            property={property}
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            dateTimeInputs={dateTimeInputs}
            onNumberChange={(propertyId, value) =>
              setNumberInputs(current => ({
                ...current,
                [propertyId]: value,
              }))}
            onBooleanChange={(propertyId, value) =>
              setBooleanInputs(currentInputs => ({
                ...currentInputs,
                [propertyId]: value,
              }))}
            onDateTimeChange={(propertyId, value) =>
              setDateTimeInputs(current => ({
                ...current,
                [propertyId]: value,
              }))}
          />
        ))}
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
