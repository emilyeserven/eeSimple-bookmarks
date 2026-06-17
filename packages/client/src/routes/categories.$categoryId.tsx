import type { CustomPropertyType } from "@eesimple/types";

import { createFileRoute } from "@tanstack/react-router";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/categories/$categoryId")({
  component: CategoryPage,
});

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  tiered_tags: "Tiered Tags",
  number: "Number",
};

function CategoryPage() {
  const {
    categoryId,
  } = Route.useParams();
  const {
    data: categories, isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties, isLoading: propertiesLoading,
  } = useCustomProperties();

  const category = (categories ?? []).find(item => item.id === categoryId);
  const assigned = (properties ?? []).filter(property =>
    property.categoryIds.includes(categoryId));

  if (categoriesLoading || propertiesLoading) {
    return <p className="text-muted-foreground">Loading category…</p>;
  }

  if (!category) {
    return <p className="text-destructive">Category not found.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CategoryIcon
            name={category.icon}
            className="size-6"
          />
          {category.name}
        </h1>
        {category.description
          ? <p className="text-sm text-muted-foreground">{category.description}</p>
          : null}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Custom properties</h2>
        {assigned.length === 0
          ? (
            <p className="text-muted-foreground">
              No custom properties are assigned to this category yet.
            </p>
          )
          : (
            assigned.map(property => (
              <Card key={property.id}>
                <CardHeader
                  className="flex-row items-center gap-2 space-y-0"
                >
                  <CardTitle>{property.name}</CardTitle>
                  <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
                  {property.type === "number"
                    ? (
                      <span className="text-xs text-muted-foreground">
                        {`${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`}
                      </span>
                    )
                    : null}
                </CardHeader>
                <CardContent />
              </Card>
            ))
          )}
      </div>
    </section>
  );
}
