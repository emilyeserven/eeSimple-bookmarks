import type { Category, CustomProperty, CustomPropertyType } from "@eesimple/types";

import { z } from "zod";

import { useCategories } from "../hooks/useCategories";
import {
  useCreateCustomProperty,
  useCustomProperties,
  useDeleteCustomProperty,
  useUpdateCustomProperty,
} from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
};

const TYPE_OPTIONS = [
  {
    value: "number",
    label: "Number",
  },
  {
    value: "boolean",
    label: "Boolean",
  },
  {
    value: "calculate",
    label: "Calculate (Sum)",
  },
];

const propertySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["number", "boolean", "calculate"]),
    numberMin: z.string(),
    numberMax: z.string(),
    disableMin: z.boolean(),
    disableMax: z.boolean(),
    unitSingular: z.string(),
    unitPlural: z.string(),
    operandIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    showInForm: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "calculate" && value.operandIds.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least two Number properties.",
        path: ["operandIds"],
      });
    }
  });

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

  const numberProperties = (properties ?? []).filter(property => property.type === "number");

  const form = useAppForm({
    defaultValues: {
      name: "",
      type: "number" as CustomPropertyType,
      numberMin: "0",
      numberMax: "100",
      disableMin: false,
      disableMax: false,
      unitSingular: "",
      unitPlural: "",
      operandIds: [] as string[],
      categoryIds: [] as string[],
      showInForm: false,
    },
    validators: {
      onChange: propertySchema,
    },
    onSubmit: ({
      value,
    }) => {
      const isNumber = value.type === "number";
      createProperty.mutate({
        name: value.name.trim(),
        type: value.type,
        numberMin: isNumber && !value.disableMin ? Number(value.numberMin) : null,
        numberMax: isNumber && !value.disableMax ? Number(value.numberMax) : null,
        unitSingular: isNumber ? (value.unitSingular.trim() || null) : null,
        unitPlural: isNumber ? (value.unitPlural.trim() || null) : null,
        operandPropertyIds: value.type === "calculate" ? value.operandIds : undefined,
        categoryIds: value.categoryIds,
        showInForm: value.showInForm,
      });
      form.reset();
    },
  });

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New custom property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div
              className="
                grid gap-3
                sm:grid-cols-2
              "
            >
              <form.AppField name="name">
                {field => (
                  <field.TextField
                    label="Name"
                    placeholder="e.g. Priority"
                  />
                )}
              </form.AppField>

              <form.AppField name="type">
                {field => (
                  <field.SelectField
                    label="Type"
                    options={TYPE_OPTIONS}
                  />
                )}
              </form.AppField>

              <form.Subscribe selector={state => state.values.type}>
                {type =>
                  type === "number"
                    ? (
                      <>
                        <div className="space-y-1">
                          <form.Subscribe selector={state => state.values.disableMin}>
                            {disableMin => (
                              <form.AppField name="numberMin">
                                {field => (
                                  <field.TextField
                                    label="Slider minimum"
                                    type="number"
                                    disabled={disableMin}
                                  />
                                )}
                              </form.AppField>
                            )}
                          </form.Subscribe>
                          <form.AppField name="disableMin">
                            {field => (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="property-disable-min"
                                  checked={field.state.value}
                                  onCheckedChange={checked => field.handleChange(checked === true)}
                                />
                                <Label
                                  htmlFor="property-disable-min"
                                  className="text-xs text-muted-foreground"
                                >
                                  No minimum
                                </Label>
                              </div>
                            )}
                          </form.AppField>
                        </div>
                        <div className="space-y-1">
                          <form.Subscribe selector={state => state.values.disableMax}>
                            {disableMax => (
                              <form.AppField name="numberMax">
                                {field => (
                                  <field.TextField
                                    label="Slider maximum"
                                    type="number"
                                    disabled={disableMax}
                                  />
                                )}
                              </form.AppField>
                            )}
                          </form.Subscribe>
                          <form.AppField name="disableMax">
                            {field => (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="property-disable-max"
                                  checked={field.state.value}
                                  onCheckedChange={checked => field.handleChange(checked === true)}
                                />
                                <Label
                                  htmlFor="property-disable-max"
                                  className="text-xs text-muted-foreground"
                                >
                                  No maximum
                                </Label>
                              </div>
                            )}
                          </form.AppField>
                        </div>
                        <form.AppField name="unitSingular">
                          {field => (
                            <field.TextField
                              label="Unit (singular)"
                              placeholder="e.g. star"
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="unitPlural">
                          {field => (
                            <field.TextField
                              label="Unit (plural)"
                              placeholder="e.g. stars"
                            />
                          )}
                        </form.AppField>
                      </>
                    )
                    : null}
              </form.Subscribe>
            </div>

            <form.Subscribe selector={state => state.values.type}>
              {type =>
                type === "calculate"
                  ? (
                    <form.AppField name="operandIds">
                      {field => (
                        <div className="space-y-2">
                          <Label>Operands (summed)</Label>
                          <OperandCheckboxList
                            numberProperties={numberProperties}
                            selectedIds={field.state.value}
                            onToggle={id => field.handleChange(toggleId(field.state.value, id))}
                          />
                          {field.state.meta.errors.length > 0
                            ? (
                              <p className="text-xs text-destructive">
                                Select at least two Number properties.
                              </p>
                            )
                            : null}
                        </div>
                      )}
                    </form.AppField>
                  )
                  : null}
            </form.Subscribe>

            <form.AppField name="categoryIds">
              {field => (
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <CategoryCheckboxList
                    categories={categories ?? []}
                    selectedIds={field.state.value}
                    onToggle={id => field.handleChange(toggleId(field.state.value, id))}
                    idPrefix="new-property-category"
                  />
                </div>
              )}
            </form.AppField>

            <form.AppField name="showInForm">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="property-show-in-form"
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor="property-show-in-form">
                    Show in the main bookmark form
                    <span className="ml-1 text-xs text-muted-foreground">
                      (otherwise it appears under Advanced)
                    </span>
                  </Label>
                </div>
              )}
            </form.AppField>

            <form.AppForm>
              <form.SubmitButton label="Add property" />
            </form.AppForm>
            {createProperty.isError
              ? <p className="text-sm text-destructive">{createProperty.error.message}</p>
              : null}
          </form>
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

/** A property row: read its name/type/units and inline-edit its categories and form visibility. */
export function PropertyCard({
  property,
  categories,
  allProperties,
  onDeleted,
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

  function toggleShowInForm(showInForm: boolean) {
    updateProperty.mutate({
      id: property.id,
      input: {
        showInForm,
      },
    });
  }

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

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Categories</Label>
          <CategoryCheckboxList
            categories={categories}
            selectedIds={property.categoryIds}
            onToggle={toggleCategory}
            idPrefix={`property-category-${property.id}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`property-show-in-form-${property.id}`}
            checked={property.showInForm}
            onCheckedChange={checked => toggleShowInForm(checked === true)}
          />
          <Label htmlFor={`property-show-in-form-${property.id}`}>
            Show in the main bookmark form
          </Label>
        </div>
      </div>
    </div>
  );
}
