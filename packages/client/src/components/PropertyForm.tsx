import type {
  Category,
  CreateCustomPropertyInput,
  CustomProperty,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { z } from "zod";

import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

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
    description: z.string(),
    numberMin: z.string(),
    numberMax: z.string(),
    disableMin: z.boolean(),
    disableMax: z.boolean(),
    unitSingular: z.string(),
    unitPlural: z.string(),
    valuePrefix: z.string(),
    zeroLabel: z.string(),
    maxLabel: z.string(),
    operandIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    showInForm: z.boolean(),
    advancedOnly: z.boolean(),
    showInListings: z.boolean(),
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

type PropertyFormValues = z.infer<typeof propertySchema>;

/** Add or remove `id` from `ids`, returning a new array. */
function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

const CREATE_DEFAULTS: PropertyFormValues = {
  name: "",
  type: "number",
  description: "",
  // No minimum / maximum by default — the disable boxes start checked.
  numberMin: "0",
  numberMax: "100",
  disableMin: true,
  disableMax: true,
  unitSingular: "",
  unitPlural: "",
  valuePrefix: "",
  zeroLabel: "",
  maxLabel: "",
  operandIds: [],
  categoryIds: [],
  showInForm: true,
  advancedOnly: false,
  showInListings: true,
};

/** Map a saved property to editable form values (null bounds become the "disabled" state). */
function valuesFromProperty(property: CustomProperty): PropertyFormValues {
  return {
    name: property.name,
    type: property.type,
    description: property.description ?? "",
    numberMin: property.numberMin === null ? "0" : String(property.numberMin),
    numberMax: property.numberMax === null ? "100" : String(property.numberMax),
    disableMin: property.numberMin === null,
    disableMax: property.numberMax === null,
    unitSingular: property.unitSingular ?? "",
    unitPlural: property.unitPlural ?? "",
    valuePrefix: property.valuePrefix ?? "",
    zeroLabel: property.zeroLabel ?? "",
    maxLabel: property.maxLabel ?? "",
    operandIds: property.operandPropertyIds,
    categoryIds: property.categoryIds,
    showInForm: property.showInForm,
    advancedOnly: property.advancedOnly,
    showInListings: property.showInListings,
  };
}

/** Build the create/update payload from form values (`type` is ignored by the update route). */
function payloadFromValues(values: PropertyFormValues): CreateCustomPropertyInput {
  const isNumber = values.type === "number";
  const trimOrNull = (value: string): string | null => (value.trim() ? value.trim() : null);
  return {
    name: values.name.trim(),
    type: values.type,
    description: trimOrNull(values.description),
    numberMin: isNumber && !values.disableMin ? Number(values.numberMin) : null,
    numberMax: isNumber && !values.disableMax ? Number(values.numberMax) : null,
    unitSingular: isNumber ? trimOrNull(values.unitSingular) : null,
    unitPlural: isNumber ? trimOrNull(values.unitPlural) : null,
    valuePrefix: isNumber ? trimOrNull(values.valuePrefix) : null,
    zeroLabel: isNumber ? trimOrNull(values.zeroLabel) : null,
    maxLabel: isNumber ? trimOrNull(values.maxLabel) : null,
    operandPropertyIds: values.type === "calculate" ? values.operandIds : undefined,
    categoryIds: values.categoryIds,
    showInForm: values.showInForm,
    advancedOnly: values.advancedOnly,
    showInListings: values.showInListings,
  };
}

interface CategoryCheckboxListProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  idPrefix: string;
  /** When set, render a leading "Select all" checkbox that selects every / no category. */
  onToggleAll?: (selectAll: boolean) => void;
}

/** A checkbox list for assigning a property to zero, one, or many categories. */
function CategoryCheckboxList({
  categories,
  selectedIds,
  onToggle,
  idPrefix,
  onToggleAll,
}: CategoryCheckboxListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No categories yet. Create some on the Categories page.
      </p>
    );
  }
  const allSelected = categories.every(category => selectedIds.includes(category.id));
  return (
    <div className="space-y-2">
      {onToggleAll
        ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-select-all`}
              checked={allSelected}
              onCheckedChange={() => onToggleAll(!allSelected)}
            />
            <Label
              htmlFor={`${idPrefix}-select-all`}
              className="text-xs text-muted-foreground"
            >
              Select all
            </Label>
          </div>
        )
        : null}
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

/** A bordered, titled group of related fields (e.g. "Property options", "Display options"). */
function FormSection({
  title, description, children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

interface PropertyFormProps {
  /** `create` shows an editable Type select; `edit` locks Type (it is immutable) and prefills values. */
  mode: "create" | "edit";
  categories: Category[];
  /** Number properties offered as Calculate operands (exclude the property being edited). */
  numberProperties: CustomProperty[];
  /** The property to edit; required in `edit` mode. */
  property?: CustomProperty;
  /** Receives the built payload; the update route ignores `type`. */
  onSubmit: (payload: CreateCustomPropertyInput) => void;
  submitLabel: string;
  pendingLabel?: string;
  /** Reset back to blank defaults after a successful submit (used by the create form). */
  resetOnSubmit?: boolean;
  /** A mutation error to surface beneath the submit button. */
  errorMessage?: string;
  /** Extra controls rendered alongside the submit button (e.g. a Delete button). */
  actions?: ReactNode;
  /** Unique prefix for category checkbox ids so multiple forms can coexist on a page. */
  idPrefix: string;
}

/** Shared create/edit form for a custom property, used by the settings page and the right panel. */
export function PropertyForm({
  mode,
  categories,
  numberProperties,
  property,
  onSubmit,
  submitLabel,
  pendingLabel,
  resetOnSubmit,
  errorMessage,
  actions,
  idPrefix,
}: PropertyFormProps) {
  const form = useAppForm({
    defaultValues: property ? valuesFromProperty(property) : CREATE_DEFAULTS,
    validators: {
      onChange: propertySchema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit(payloadFromValues(value));
      if (resetOnSubmit) form.reset();
    },
  });

  return (
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
              disabled={mode === "edit"}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label="Description"
            placeholder="Optional — shown as a hint where this property appears."
            rows={2}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          type === "number"
            ? (
              <FormSection title="Property options">
                <div
                  className="
                    grid gap-3
                    sm:grid-cols-2
                  "
                >
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
                  <form.AppField name="valuePrefix">
                    {field => (
                      <field.TextField
                        label="Value prefix"
                        placeholder="e.g. $"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="zeroLabel">
                    {field => (
                      <field.TextField
                        label="Zero label"
                        placeholder="e.g. Free"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="maxLabel">
                    {field => (
                      <field.TextField
                        label="Maximum label"
                        placeholder="e.g. Unlimited"
                      />
                    )}
                  </form.AppField>
                </div>
              </FormSection>
            )
            : null}
      </form.Subscribe>

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
              categories={categories}
              selectedIds={field.state.value}
              onToggle={id => field.handleChange(toggleId(field.state.value, id))}
              onToggleAll={selectAll =>
                field.handleChange(selectAll ? categories.map(category => category.id) : [])}
              idPrefix={idPrefix}
            />
          </div>
        )}
      </form.AppField>

      <FormSection title="Display options">
        <div className="space-y-2">
          <span className="text-sm font-medium">Show in…</span>
          <div className="space-y-2">
            <form.AppField name="showInForm">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-show-in-form`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-show-in-form`}>Main bookmark form</Label>
                </div>
              )}
            </form.AppField>
            <form.Subscribe selector={state => state.values.showInForm}>
              {showInForm =>
                showInForm
                  ? (
                    <form.AppField name="advancedOnly">
                      {field => (
                        <div className="ml-6 flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-advanced-only`}
                            checked={field.state.value}
                            onCheckedChange={checked => field.handleChange(checked === true)}
                          />
                          <Label
                            htmlFor={`${idPrefix}-advanced-only`}
                            className="text-xs text-muted-foreground"
                          >
                            Only show in Advanced area
                          </Label>
                        </div>
                      )}
                    </form.AppField>
                  )
                  : null}
            </form.Subscribe>
            <form.AppField name="showInListings">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-show-in-listings`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-show-in-listings`}>Bookmark listings</Label>
                </div>
              )}
            </form.AppField>
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-2">
        <form.AppForm>
          <form.SubmitButton
            label={submitLabel}
            pendingLabel={pendingLabel}
          />
        </form.AppForm>
        {actions}
      </div>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </form>
  );
}
