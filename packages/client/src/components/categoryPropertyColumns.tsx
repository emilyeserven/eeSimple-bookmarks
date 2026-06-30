import type { CustomProperty, CustomPropertyType, UpdateCustomPropertyInput } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { propertyAppliesToCategory } from "@eesimple/types";

import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
  datetime: "Date / Time",
  ratingScale: "Rating Scale",
  image: "Image",
  file: "File",
  choices: "Choices",
  itemInItems: "Two Numbers",
  sections: "Sections",
  text: "Text",
};

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
  return [
    {
      id: "assigned",
      header: "Assigned",
      cell: ({
        row,
      }) => {
        const property = row.original;
        return (
          <Checkbox
            aria-label={`Assign ${property.name}`}
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
                onSuccess: () => notifyFieldSaved("Assigned properties"),
                onError: error => notifyFieldSaveError("Assigned properties", describeError(error)),
              })}
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({
        row,
      }) => (
        <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>
      ),
    },
  ];
}
