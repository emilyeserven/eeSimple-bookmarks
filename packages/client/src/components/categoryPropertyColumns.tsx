import type { CustomProperty, CustomPropertyType, UpdateCustomPropertyInput } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { propertyAppliesToCategory } from "@eesimple/types";

import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import i18n from "@/i18n";

function buildTypeLabels(): Record<CustomPropertyType, string> {
  return {
    number: i18n.t("Number"),
    boolean: i18n.t("Boolean"),
    calculate: i18n.t("Calculate (Sum)"),
    datetime: i18n.t("Date / Time"),
    ratingScale: i18n.t("Rating Scale"),
    image: i18n.t("Image"),
    file: i18n.t("File"),
    choices: i18n.t("Choices"),
    itemInItems: i18n.t("Two Numbers"),
    sections: i18n.t("Sections"),
    text: i18n.t("Text"),
  };
}

/** Mutation shape needed to toggle a property's category assignment from the table. */
interface UpdatePropertyMutation {
  mutate: (
    variables: {
      id: string;
      input: UpdateCustomPropertyInput;
    },
    options?: {
      onSuccess?: () => void;
      onError?: (error: unknown) => void;
    },
  ) => void;
}

/**
 * Column definitions for the category "Assigned properties" table — an Assigned checkbox that
 * toggles the property's membership in this category, plus the property's name and type badge.
 */
export function buildCategoryPropertyColumns(
  categoryId: string,
  updateProperty: UpdatePropertyMutation,
): ColumnDef<CustomProperty>[] {
  const typeLabels = buildTypeLabels();
  return [
    {
      id: "assigned",
      header: i18n.t("Assigned"),
      cell: ({
        row,
      }) => {
        const property = row.original;
        return (
          <Checkbox
            aria-label={i18n.t("Assign {{name}}", {
              name: property.name,
            })}
            checked={propertyAppliesToCategory(property, categoryId)}
            onCheckedChange={() =>
              updateProperty.mutate({
                id: property.id,
                // Unchecking a property that applies to "all categories" drops that flag and
                // falls back to its explicit list (minus this category).
                input: {
                  allCategories: false,
                  categoryIds: toggleId(property.categoryIds, categoryId),
                },
              }, {
                onSuccess: () => notifyFieldSaved(i18n.t("Assigned properties")),
                onError: error => notifyFieldSaveError(i18n.t("Assigned properties"), describeError(error)),
              })}
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: i18n.t("Name"),
    },
    {
      accessorKey: "type",
      header: i18n.t("Type"),
      cell: ({
        row,
      }) => (
        <Badge variant="secondary">{typeLabels[row.original.type]}</Badge>
      ),
    },
  ];
}
