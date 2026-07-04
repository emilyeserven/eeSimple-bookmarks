import type { Category } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { CategoryDefaultField } from "./CategoryDefaultField";
import {
  useCategoryDefaults,
  useSetCategoryDefaults,
} from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { buildNumberValuesFromInputs } from "../lib/propertyValues";

import { Label } from "@/components/ui/label";

interface CategoryDefaultsSectionProps {
  category: Category;
}

/**
 * Editor for a category's default custom-property values, applied to new bookmarks added to it.
 * Only properties assigned to this category are shown; calculate properties are computed on save.
 * Auto-saves per the edit-tab standard: the Yes/No selects persist on change, the scalar inputs on
 * blur (one "Default property values" section toast per save — fired by the mutation hook).
 */
export function CategoryDefaultsSection({
  category,
}: CategoryDefaultsSectionProps) {
  const {
    t,
  } = useTranslation();
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

  // Scalar (number/date/rating) edits mark the section dirty; the save fires when focus leaves it.
  const dirtyRef = useRef(false);

  const categoryProps = (properties ?? []).filter(property =>
    propertyAppliesToCategory(property, category.id)
    && property.type !== "calculate"
    && property.allowDefault !== false);
  if (categoryProps.length === 0) return null;

  function persist(nextBooleanInputs: Record<string, boolean | undefined> = booleanInputs) {
    const numberValues = buildNumberValuesFromInputs(categoryProps, numberInputs);
    const booleanValues = categoryProps
      .filter(property => property.type === "boolean")
      .map(property => ({
        propertyId: property.id,
        value: nextBooleanInputs[property.id],
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
      <Label>{t("Default property values")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("Prefilled when you add a bookmark to this category. You can still change them per bookmark. Changes save automatically.")}
      </p>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
        onBlur={() => {
          if (!dirtyRef.current) return;
          dirtyRef.current = false;
          persist();
        }}
      >
        {categoryProps.map(property => (
          <CategoryDefaultField
            key={property.id}
            category={category}
            property={property}
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            dateTimeInputs={dateTimeInputs}
            onNumberChange={(propertyId, value) => {
              dirtyRef.current = true;
              setNumberInputs(current => ({
                ...current,
                [propertyId]: value,
              }));
            }}
            onBooleanChange={(propertyId, value) => {
              const next = {
                ...booleanInputs,
                [propertyId]: value,
              };
              setBooleanInputs(next);
              persist(next);
            }}
            onDateTimeChange={(propertyId, value) => {
              dirtyRef.current = true;
              setDateTimeInputs(current => ({
                ...current,
                [propertyId]: value,
              }));
            }}
          />
        ))}
      </div>
    </div>
  );
}
