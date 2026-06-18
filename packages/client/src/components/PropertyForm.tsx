import type {
  Category,
  CreateCustomPropertyInput,
  CustomProperty,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { z } from "zod";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { LabeledSection } from "./LabeledSection";
import { CategoryCheckboxList, OperandCheckboxList } from "./PropertyFormFields";
import { useAppForm } from "../lib/form";
import {
  DATE_TIME_FORMAT_OPTIONS,
  summarizeCategories,
  summarizeNumberOptions,
  toggleId,
  TYPE_OPTIONS,
} from "../lib/propertyForm";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const propertySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["number", "boolean", "calculate", "datetime"]),
    dateTimeFormat: z.enum(["date", "time", "datetime"]),
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
    allCategories: z.boolean(),
    inForm: z.boolean(),
    advancedOnly: z.boolean(),
    showInListings: z.boolean(),
    editableOnCard: z.boolean(),
    enabled: z.boolean(),
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

const CREATE_DEFAULTS: PropertyFormValues = {
  name: "",
  type: "number",
  dateTimeFormat: "date",
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
  allCategories: false,
  inForm: true,
  advancedOnly: false,
  showInListings: true,
  editableOnCard: false,
  enabled: true,
};

/** Map a saved property to editable form values (null bounds become the "disabled" state). */
function valuesFromProperty(property: CustomProperty): PropertyFormValues {
  return {
    name: property.name,
    type: property.type,
    dateTimeFormat: property.dateTimeFormat ?? "date",
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
    allCategories: property.allCategories,
    inForm: !property.hiddenFromForm,
    advancedOnly: !property.showInForm,
    showInListings: property.showInListings,
    editableOnCard: property.editableOnCard,
    enabled: property.enabled,
  };
}

/** Build the create/update payload from form values (`type` is ignored by the update route). */
function payloadFromValues(values: PropertyFormValues): CreateCustomPropertyInput {
  const isNumber = values.type === "number";
  const trimOrNull = (value: string): string | null => (value.trim() ? value.trim() : null);
  return {
    name: values.name.trim(),
    type: values.type,
    dateTimeFormat: values.type === "datetime" ? values.dateTimeFormat : null,
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
    allCategories: values.allCategories,
    hiddenFromForm: !values.inForm,
    showInForm: !values.advancedOnly,
    showInListings: values.showInListings,
    // Calculate values are computed server-side, so they can never be edited from the card menu.
    editableOnCard: values.type === "calculate" ? false : values.editableOnCard,
    enabled: values.enabled,
  };
}

/** One section of the property form, used to render a single tab on the edit pages. */
export type PropertyFormSection = "general" | "options" | "categories" | "display";

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
  /**
   * Render only one section (a single edit tab) instead of the whole form. The form still validates
   * and submits every field — the property is prefilled, so saving from any tab persists the full
   * record. Omit to render the complete form (create page + right panel).
   */
  section?: PropertyFormSection;
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
  section,
}: PropertyFormProps) {
  const isBuiltIn = mode === "edit" && Boolean(property?.builtIn);
  // When `section` is set we render a single tab; the dividers/collapsibles only make sense in the
  // full form, and a section's collapsible defaults to open.
  const full = section === undefined;
  const showGeneral = full || section === "general";
  const showOptions = full || section === "options";
  const showCategories = full || section === "categories";
  const showDisplay = full || section === "display";
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
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {showGeneral
        ? (
          <div className="space-y-4">
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

            <form.AppField name="enabled">
              {field => (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${idPrefix}-enabled`}
                      checked={field.state.value}
                      disabled={isBuiltIn}
                      onCheckedChange={checked => field.handleChange(checked === true)}
                    />
                    <Label htmlFor={`${idPrefix}-enabled`}>Property is active</Label>
                  </div>
                  {isBuiltIn
                    ? <p className="text-xs text-muted-foreground">Built-in properties can&apos;t be disabled.</p>
                    : null}
                </div>
              )}
            </form.AppField>

            <form.AppField name="description">
              {field => (
                <field.TextareaField
                  label="Description"
                  placeholder="Optional — shown as a hint where this property appears."
                  rows={2}
                />
              )}
            </form.AppField>
          </div>
        )
        : null}

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          showOptions && type === "number"
            ? (
              <>
                {full ? <Separator /> : null}

                <CollapsibleFormSection
                  title="Property options"
                  description="Configure the slider range, units, and labels for this number."
                  defaultOpen={mode === "create" || section === "options"}
                  preview={(
                    <form.Subscribe
                      selector={state => ({
                        disableMin: state.values.disableMin,
                        disableMax: state.values.disableMax,
                        numberMin: state.values.numberMin,
                        numberMax: state.values.numberMax,
                        unitPlural: state.values.unitPlural,
                        valuePrefix: state.values.valuePrefix,
                      })}
                    >
                      {values => summarizeNumberOptions(values)}
                    </form.Subscribe>
                  )}
                >
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
                </CollapsibleFormSection>
              </>
            )
            : null}
      </form.Subscribe>

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          showOptions && type === "datetime"
            ? (
              <>
                {full ? <Separator /> : null}

                <LabeledSection title="Property options">
                  <form.AppField name="dateTimeFormat">
                    {field => (
                      <field.SelectField
                        label="Captures"
                        options={DATE_TIME_FORMAT_OPTIONS}
                        disabled={mode === "edit"}
                      />
                    )}
                  </form.AppField>
                </LabeledSection>
              </>
            )
            : null}
      </form.Subscribe>

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          showOptions && type === "calculate"
            ? (
              <>
                {full ? <Separator /> : null}

                <LabeledSection title="Operands">
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
                </LabeledSection>
              </>
            )
            : null}
      </form.Subscribe>

      {full ? <Separator /> : null}

      {showCategories && (
        <CollapsibleFormSection
          title="Categories"
          description="Choose which categories this property applies to."
          defaultOpen={mode === "create" || section === "categories"}
          preview={(
            <form.Subscribe
              selector={state => ({
                allCategories: state.values.allCategories,
                categoryIds: state.values.categoryIds,
              })}
            >
              {({
                allCategories, categoryIds,
              }) => summarizeCategories(allCategories, categoryIds)}
            </form.Subscribe>
          )}
        >
          <form.Subscribe selector={state => state.values.allCategories}>
            {allCategories => (
              <form.AppField name="categoryIds">
                {field => (
                  <CategoryCheckboxList
                    categories={categories}
                    selectedIds={field.state.value}
                    allCategories={allCategories}
                    onToggle={(id) => {
                      if (allCategories) {
                      // Toggling one category drops the "all categories" flag and falls back to an
                      // explicit list of every current category except the one just unchecked.
                        form.setFieldValue("allCategories", false);
                        field.handleChange(
                          categories.map(category => category.id).filter(categoryId => categoryId !== id),
                        );
                      }
                      else {
                        field.handleChange(toggleId(field.state.value, id));
                      }
                    }}
                    onToggleAll={(selectAll) => {
                    // Select all also means "apply to categories created later" via the flag.
                      form.setFieldValue("allCategories", selectAll);
                      field.handleChange(selectAll ? categories.map(category => category.id) : []);
                    }}
                    idPrefix={idPrefix}
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </CollapsibleFormSection>
      )}

      {full ? <Separator /> : null}

      {showDisplay
        ? (
          <LabeledSection title="Display options">
            <div className="space-y-2">
              <span className="text-sm font-medium">Show in…</span>
              <div className="space-y-2">
                <form.AppField name="inForm">
                  {field => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-in-form`}
                        checked={field.state.value}
                        onCheckedChange={checked => field.handleChange(checked === true)}
                      />
                      <Label htmlFor={`${idPrefix}-in-form`}>Main bookmark form</Label>
                    </div>
                  )}
                </form.AppField>
                <form.Subscribe selector={state => state.values.inForm}>
                  {inForm =>
                    inForm
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
            <form.Subscribe selector={state => state.values.type}>
              {type =>
                type === "calculate"
                  ? null
                  : (
                    <div className="space-y-2 border-t pt-3">
                      <span className="text-sm font-medium">Editing</span>
                      <form.AppField name="editableOnCard">
                        {field => (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`${idPrefix}-editable-on-card`}
                              checked={field.state.value}
                              onCheckedChange={checked => field.handleChange(checked === true)}
                            />
                            <Label htmlFor={`${idPrefix}-editable-on-card`}>
                              Allow editing from the bookmark card menu
                            </Label>
                          </div>
                        )}
                      </form.AppField>
                    </div>
                  )}
            </form.Subscribe>
          </LabeledSection>
        )
        : null}

      {full ? <Separator /> : null}

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
