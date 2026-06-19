import type {
  Category,
  CreateCustomPropertyInput,
  CustomProperty,
  PropertyGroup,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { LabeledSection } from "./LabeledSection";
import {
  BOOLEAN_LABEL_PRESET_OPTIONS,
  CategoryCheckboxList,
  CREATE_DEFAULTS,
  DATE_TIME_FORMAT_OPTIONS,
  OperandCheckboxList,
  payloadFromValues,
  PropertyDisplaySection,
  propertySchema,
  summarizeBooleanOptions,
  summarizeCategories,
  summarizeNumberOptions,
  toggleId,
  TYPE_OPTIONS,
  valuesFromProperty,
} from "./propertyFormParts";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** One section of the property form, used to render a single tab on the edit pages. */
export type PropertyFormSection = "general" | "options" | "categories" | "display";

interface PropertyFormProps {
  /** `create` shows an editable Type select; `edit` locks Type (it is immutable) and prefills values. */
  mode: "create" | "edit";
  categories: Category[];
  /** Number properties offered as Calculate operands (exclude the property being edited). */
  numberProperties: CustomProperty[];
  /** Property groups offered in the Display tab's "Group" combobox. */
  propertyGroups: PropertyGroup[];
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
  propertyGroups,
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
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const groupOptions = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map(group => ({
      value: group.id,
      label: group.name,
    }));
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

  function allowDefaultBlock(className: string): ReactNode {
    return (
      <div className={className}>
        <form.AppField name="allowDefault">
          {field => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-allow-default`}
                checked={field.state.value}
                onCheckedChange={checked => field.handleChange(checked === true)}
              />
              <Label htmlFor={`${idPrefix}-allow-default`}>Allow default value</Label>
            </div>
          )}
        </form.AppField>
        <p className="text-xs text-muted-foreground">
          When disabled, this property will not appear in the category defaults editor.
        </p>
      </div>
    );
  }

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
                    {allowDefaultBlock("col-span-full space-y-1")}
                  </div>
                </CollapsibleFormSection>
              </>
            )
            : null}
      </form.Subscribe>

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          showOptions && type === "boolean"
            ? (
              <>
                {full ? <Separator /> : null}

                <CollapsibleFormSection
                  title="Property options"
                  description="Configure how the boolean value is displayed."
                  defaultOpen={mode === "create" || section === "options"}
                  preview={(
                    <form.Subscribe
                      selector={state => ({
                        showIfFalse: state.values.showIfFalse,
                        booleanLabelPreset: state.values.booleanLabelPreset,
                        booleanTrueLabel: state.values.booleanTrueLabel,
                        booleanFalseLabel: state.values.booleanFalseLabel,
                      })}
                    >
                      {values => summarizeBooleanOptions(values)}
                    </form.Subscribe>
                  )}
                >
                  <div className="space-y-4">
                    <form.AppField name="booleanLabelPreset">
                      {field => (
                        <field.SelectField
                          label="Display labels"
                          options={BOOLEAN_LABEL_PRESET_OPTIONS}
                        />
                      )}
                    </form.AppField>

                    <form.Subscribe selector={state => state.values.booleanLabelPreset}>
                      {preset =>
                        preset === "custom"
                          ? (
                            <div
                              className="
                                grid gap-3
                                sm:grid-cols-2
                              "
                            >
                              <form.AppField name="booleanTrueLabel">
                                {field => (
                                  <field.TextField
                                    label="True label"
                                    placeholder="e.g. Read"
                                  />
                                )}
                              </form.AppField>
                              <form.AppField name="booleanFalseLabel">
                                {field => (
                                  <field.TextField
                                    label="False label"
                                    placeholder="e.g. Unread"
                                  />
                                )}
                              </form.AppField>
                            </div>
                          )
                          : null}
                    </form.Subscribe>

                    <form.AppField name="showIfFalse">
                      {field => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-show-if-false`}
                            checked={field.state.value}
                            onCheckedChange={checked => field.handleChange(checked === true)}
                          />
                          <Label htmlFor={`${idPrefix}-show-if-false`}>
                            Show if false
                          </Label>
                        </div>
                      )}
                    </form.AppField>
                    <p className="text-xs text-muted-foreground">
                      When unchecked, the property is hidden from cards and detail pages when its value is false.
                    </p>
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
                  <div className="space-y-4">
                    <form.AppField name="dateTimeFormat">
                      {field => (
                        <field.SelectField
                          label="Captures"
                          options={DATE_TIME_FORMAT_OPTIONS}
                          disabled={mode === "edit"}
                        />
                      )}
                    </form.AppField>
                    {allowDefaultBlock("space-y-1")}
                  </div>
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

      <form.Subscribe selector={state => state.values.type}>
        {type =>
          showOptions && type === "boolean"
            ? (
              <>
                {full ? <Separator /> : null}

                <LabeledSection title="Property options">
                  {allowDefaultBlock("space-y-1")}
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
          <PropertyDisplaySection
            form={form}
            idPrefix={idPrefix}
            groupOptions={groupOptions}
            addGroupOpen={addGroupOpen}
            setAddGroupOpen={setAddGroupOpen}
          />
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
