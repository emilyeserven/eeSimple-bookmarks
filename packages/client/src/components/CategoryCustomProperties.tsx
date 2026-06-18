import type { Category, CustomPropertyType } from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";

import { CategoryDefaultsSection } from "./CategoryDefaultsSection";
import {
  useCustomProperties,
  useUpdateCustomProperty,
} from "../hooks/useCustomProperties";
import { toggleId } from "../lib/tag-utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
  datetime: "Date / Time",
};

interface CategoryCustomPropertiesProps {
  category: Category;
}

/**
 * Choose which custom properties this category has access to, and edit the default values
 * applied to new bookmarks added to it.
 */
export function CategoryCustomProperties({
  category,
}: CategoryCustomPropertiesProps) {
  const {
    data: properties, isLoading,
  } = useCustomProperties();
  const updateProperty = useUpdateCustomProperty();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Assigned properties</Label>
        <p className="text-xs text-muted-foreground">
          Custom properties checked here are available on bookmarks in this category.
        </p>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading properties…</p> : null}
        {!isLoading && (properties?.length ?? 0) === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No custom properties yet. Create some on the Custom Properties settings page.
            </p>
          )
          : null}
        <div
          className="
            grid gap-2
            sm:grid-cols-2
          "
        >
          {(properties ?? []).filter(p => p.enabled).map((property) => {
            const inputId = `category-property-${property.id}`;
            return (
              <div
                key={property.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={inputId}
                  checked={propertyAppliesToCategory(property, category.id)}
                  onCheckedChange={() =>
                    updateProperty.mutate({
                      id: property.id,
                      // Unchecking a property that applies to "all categories" drops that flag and
                      // falls back to its explicit list (minus this category).
                      input: {
                        allCategories: false,
                        categoryIds: toggleId(property.categoryIds, category.id),
                      },
                    })}
                />
                <Label
                  htmlFor={inputId}
                  className="flex items-center gap-1.5"
                >
                  {property.name}
                  <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <CategoryDefaultsSection category={category} />
    </div>
  );
}
