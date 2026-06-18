import type { Category, CustomProperty, CustomPropertyType } from "@eesimple/types";

import { PropertyForm } from "./PropertyForm";
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

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
};

/** Create, list, and delete custom properties (Number, Boolean, Calculate). */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const createProperty = useCreateCustomProperty();

  const numberProperties = (properties ?? []).filter(property => property.type === "number");

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New custom property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PropertyForm
            mode="create"
            categories={categories ?? []}
            numberProperties={numberProperties}
            onSubmit={payload => createProperty.mutate(payload)}
            submitLabel="Add property"
            resetOnSubmit
            errorMessage={createProperty.isError ? createProperty.error.message : undefined}
            idPrefix="new-property-category"
          />
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading custom properties…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (properties?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No custom properties yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(properties ?? []).map(property => (
          <Card
            key={property.id}
            className="p-6"
          >
            <PropertyCard
              property={property}
              categories={categories ?? []}
              allProperties={properties ?? []}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

interface PropertyCardProps {
  property: CustomProperty;
  categories: Category[];
  allProperties: CustomProperty[];
  /** Called after a successful delete — e.g. the panel uses it to dismiss itself. */
  onDeleted?: () => void;
}

/** A property's header summary plus the shared edit form; also deletes the property. */
export function PropertyCard({
  property,
  categories,
  allProperties,
  onDeleted,
}: PropertyCardProps) {
  const deleteProperty = useDeleteCustomProperty();
  const updateProperty = useUpdateCustomProperty();

  // A calculate property may sum any other number property, but never itself.
  const numberProperties = allProperties.filter(
    candidate => candidate.type === "number" && candidate.id !== property.id,
  );
  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
          onClick={() => deleteProperty.mutate(property.id, {
            onSuccess: onDeleted,
          })}
        >
          Delete
        </Button>
      </div>

      <PropertyForm
        mode="edit"
        property={property}
        categories={categories}
        numberProperties={numberProperties}
        onSubmit={({
          type, ...input
        }) => updateProperty.mutate({
          id: property.id,
          input,
        })}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        errorMessage={updateProperty.isError ? updateProperty.error.message : undefined}
        idPrefix={`property-${property.id}-category`}
      />
    </div>
  );
}
