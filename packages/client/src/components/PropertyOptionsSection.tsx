import type { PropertyFormApi, PropertyFormSection } from "./propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { LabeledSection } from "./LabeledSection";
import {
  BOOLEAN_LABEL_PRESET_OPTIONS,
  DATE_TIME_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  OperandCheckboxList,
  RATING_MAX_OPTIONS,
  summarizeBooleanOptions,
  summarizeNumberOptions,
  summarizeRatingOptions,
  toggleId,
} from "./propertyFormParts";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PropertyOptionsSectionProps {
  form: PropertyFormApi;
  idPrefix: string;
  mode: "create" | "edit";
  /** Number properties offered as Calculate operands (excludes the property being edited). */
  numberProperties: CustomProperty[];
  /** Set when rendering a single edit tab; controls separators and the collapsible's default state. */
  section?: PropertyFormSection;
  /** True when rendering the whole form, gating the leading `<Separator />`. */
  full: boolean;
}

/**
 * The type-specific "Property options" section of the property form. Subscribes to the current Type
 * once and renders the matching options (number/boolean/datetime/calculate). Operates on the shared
 * form instance passed in. Extracted so `PropertyForm` keeps a lean top-level structure.
 */
export function PropertyOptionsSection({
  form,
  idPrefix,
  mode,
  numberProperties,
  section,
  full,
}: PropertyOptionsSectionProps) {
  const defaultOpen = mode === "create" || section === "options";
  return (
    <form.Subscribe selector={state => state.values.type}>
      {(type) => {
        if (type === "number") {
          return (
            <NumberOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "boolean") {
          return (
            <BooleanOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "datetime") {
          return (
            <DateTimeOptions
              form={form}
              idPrefix={idPrefix}
              mode={mode}
              full={full}
            />
          );
        }
        if (type === "calculate") {
          return (
            <CalculateOperands
              form={form}
              numberProperties={numberProperties}
              full={full}
            />
          );
        }
        if (type === "ratingScale") {
          return (
            <RatingOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        return null;
      }}
    </form.Subscribe>
  );
}

function NumberOptions({
  form,
  idPrefix,
  defaultOpen,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  defaultOpen: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <CollapsibleFormSection
        title="Property options"
        description="Configure the slider range, units, and labels for this number."
        defaultOpen={defaultOpen}
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
          <form.AppField name="numberFormat">
            {field => (
              <field.SelectField
                label="Number format"
                options={NUMBER_FORMAT_OPTIONS}
              />
            )}
          </form.AppField>
          <AllowDefaultField
            form={form}
            idPrefix={idPrefix}
            className="col-span-full space-y-1"
          />
        </div>
      </CollapsibleFormSection>
    </>
  );
}

function BooleanOptions({
  form,
  idPrefix,
  defaultOpen,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  defaultOpen: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <CollapsibleFormSection
        title="Property options"
        description="Configure how the boolean value is displayed."
        defaultOpen={defaultOpen}
        preview={(
          <form.Subscribe
            selector={state => ({
              showIfFalse: state.values.showIfFalse,
              booleanLabelPreset: state.values.booleanLabelPreset,
              booleanTrueLabel: state.values.booleanTrueLabel,
              booleanFalseLabel: state.values.booleanFalseLabel,
              showLabelColon: state.values.showLabelColon,
              showValueBeforeLabel: state.values.showValueBeforeLabel,
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

          <form.Subscribe selector={state => state.values.booleanLabelPreset}>
            {preset =>
              preset === "icons" || preset === "stars"
                ? (
                  <div className="space-y-2">
                    <form.AppField name="showLabelColon">
                      {field => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-show-label-colon`}
                            checked={field.state.value}
                            onCheckedChange={checked => field.handleChange(checked === true)}
                          />
                          <Label htmlFor={`${idPrefix}-show-label-colon`}>
                            Show colon after label
                          </Label>
                        </div>
                      )}
                    </form.AppField>
                    <form.AppField name="showValueBeforeLabel">
                      {field => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${idPrefix}-show-value-before-label`}
                            checked={field.state.value}
                            onCheckedChange={checked => field.handleChange(checked === true)}
                          />
                          <Label htmlFor={`${idPrefix}-show-value-before-label`}>
                            Show value before label
                          </Label>
                        </div>
                      )}
                    </form.AppField>
                  </div>
                )
                : null}
          </form.Subscribe>

          <AllowDefaultField
            form={form}
            idPrefix={idPrefix}
            className="space-y-1"
          />
        </div>
      </CollapsibleFormSection>
    </>
  );
}

function DateTimeOptions({
  form,
  idPrefix,
  mode,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  mode: "create" | "edit";
  full: boolean;
}) {
  return (
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
          <AllowDefaultField
            form={form}
            idPrefix={idPrefix}
            className="space-y-1"
          />
        </div>
      </LabeledSection>
    </>
  );
}

function CalculateOperands({
  form,
  numberProperties,
  full,
}: {
  form: PropertyFormApi;
  numberProperties: CustomProperty[];
  full: boolean;
}) {
  return (
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
  );
}

function RatingOptions({
  form,
  idPrefix,
  defaultOpen,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  defaultOpen: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <CollapsibleFormSection
        title="Property options"
        description="Configure the star scale and label for this rating."
        defaultOpen={defaultOpen}
        preview={(
          <form.Subscribe
            selector={state => ({
              ratingMax: state.values.ratingMax,
              ratingAllowZero: state.values.ratingAllowZero,
              ratingAllowHalf: state.values.ratingAllowHalf,
              ratingShowLabel: state.values.ratingShowLabel,
              ratingLabel: state.values.ratingLabel,
            })}
          >
            {values => summarizeRatingOptions(values)}
          </form.Subscribe>
        )}
      >
        <div className="space-y-4">
          <form.AppField name="ratingMax">
            {field => (
              <field.SelectField
                label="Scale"
                options={RATING_MAX_OPTIONS}
              />
            )}
          </form.AppField>

          <form.AppField name="ratingAllowZero">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-rating-allow-zero`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-rating-allow-zero`}>Allow a rating of 0</Label>
              </div>
            )}
          </form.AppField>

          <form.AppField name="ratingAllowHalf">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-rating-allow-half`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-rating-allow-half`}>Allow half ratings</Label>
              </div>
            )}
          </form.AppField>

          <div className="space-y-2">
            <form.AppField name="ratingShowLabel">
              {field => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${idPrefix}-rating-show-label`}
                    checked={field.state.value}
                    onCheckedChange={checked => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={`${idPrefix}-rating-show-label`}>Show a label after the stars</Label>
                </div>
              )}
            </form.AppField>
            <form.Subscribe selector={state => state.values.ratingShowLabel}>
              {showLabel =>
                showLabel
                  ? (
                    <form.AppField name="ratingLabel">
                      {field => (
                        <field.TextField
                          label="Label"
                          placeholder="e.g. out of 5"
                        />
                      )}
                    </form.AppField>
                  )
                  : null}
            </form.Subscribe>
          </div>

          <AllowDefaultField
            form={form}
            idPrefix={idPrefix}
            className="space-y-1"
          />
        </div>
      </CollapsibleFormSection>
    </>
  );
}
