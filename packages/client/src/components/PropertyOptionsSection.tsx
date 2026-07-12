import type { PropertyFormApi, PropertyFormSection, PropertyFormValues } from "./propertyFormSchema";
import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { CustomProperty } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { LabeledSection } from "./LabeledSection";
import { ChoicesOptions } from "./PropertyChoicesOptions";
import {
  BOOLEAN_LABEL_PRESET_OPTIONS,
  DATE_TIME_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  OperandCheckboxList,
  RATING_MAX_OPTIONS,
  summarizeBooleanOptions,
  summarizeItemInItemsOptions,
  summarizeNumberOptions,
  summarizeRatingOptions,
  toggleId,
} from "./propertyFormParts";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypeTree } from "../hooks/useMediaTypes";

import { TreeCombobox } from "@/components/TreeCombobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatBooleanBadge } from "@/lib/bookmarkFormat";
import { useBuiltInName } from "@/lib/builtInName";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";
import { fieldErrorMessages } from "@/lib/form";

/** One editable per-media-type text override row (the form's array element shape). */
type ItemInItemsMediaTypeTextRowValue = PropertyFormValues["itemInItemsMediaTypeTexts"][number];

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

const QUICK_FILTER_RANGE_HINT
  = "When set, the magnifying-glass quick filter on a bookmark spans the value plus and minus this "
    + "amount instead of matching it exactly. Leave blank for an exact match.";

type QuickFilterRangeFieldName
  = "quickFilterRange"
    | "quickFilterRangeDays"
    | "quickFilterRangeHours"
    | "quickFilterRangeMinutes"
    | "quickFilterRangeSeconds";

/**
 * The shared "Quick filter ± range" label, hint, and numeric unit inputs used by both the Number and
 * Datetime options. A single field renders on its own; multiple fields (the duration min/sec or the
 * datetime d/h/m/s breakdown) render in a two-column grid.
 */
function QuickFilterRangeFields({
  form,
  fields,
  className,
}: {
  form: PropertyFormApi;
  fields: { name: QuickFilterRangeFieldName;
    label: string; }[];
  className: string;
}) {
  return (
    <div className={className}>
      <Label>Quick filter ± range</Label>
      <p className="text-xs text-muted-foreground">{QUICK_FILTER_RANGE_HINT}</p>
      {fields.length === 1
        ? (
          <form.AppField name={fields[0].name}>
            {field => (
              <field.TextField
                label={fields[0].label}
                type="number"
              />
            )}
          </form.AppField>
        )
        : (
          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            {fields.map(entry => (
              <form.AppField
                key={entry.name}
                name={entry.name}
              >
                {field => (
                  <field.TextField
                    label={entry.label}
                    type="number"
                  />
                )}
              </form.AppField>
            ))}
          </div>
        )}
    </div>
  );
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
        if (type === "image" || type === "file") {
          return (
            <ImageFileOptions
              form={form}
              idPrefix={idPrefix}
              isImage={type === "image"}
              full={full}
            />
          );
        }
        if (type === "choices") {
          return (
            <ChoicesOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "itemInItems") {
          return (
            <ItemInItemsOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "sections") {
          return (
            <SectionsOptions
              form={form}
              idPrefix={idPrefix}
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
          <form.Subscribe selector={state => state.values.numberFormat}>
            {numberFormat => (
              <QuickFilterRangeFields
                form={form}
                className="col-span-full space-y-1"
                fields={numberFormat === "duration"
                  ? [
                    {
                      name: "quickFilterRangeMinutes",
                      label: "Minutes",
                    },
                    {
                      name: "quickFilterRangeSeconds",
                      label: "Seconds",
                    },
                  ]
                  : [
                    {
                      name: "quickFilterRange",
                      label: "Range (±)",
                    },
                  ]}
              />
            )}
          </form.Subscribe>
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
        description="Configure how the boolean value is displayed. Per-card display (hide label, clickable, show-if-false, colon, value order) is set per field under Card Display Rules."
        defaultOpen={defaultOpen}
        preview={(
          <form.Subscribe
            selector={state => ({
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
                label="How Values Display"
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

          <form.Subscribe
            selector={state => ({
              name: state.values.name,
              booleanLabelPreset: state.values.booleanLabelPreset,
              booleanTrueLabel: state.values.booleanTrueLabel,
              booleanFalseLabel: state.values.booleanFalseLabel,
            })}
          >
            {(values) => {
              const mock = {
                name: values.name.trim() || "Property",
                booleanLabelPreset: values.booleanLabelPreset as CustomProperty["booleanLabelPreset"],
                booleanTrueLabel: values.booleanTrueLabel.trim() || null,
                booleanFalseLabel: values.booleanFalseLabel.trim() || null,
              } as CustomProperty;
              return (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Preview</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="w-10 shrink-0 text-xs text-muted-foreground"
                      >
                        True
                      </span>
                      <span
                        className="
                          rounded-sm border bg-background px-2 py-0.5 font-mono
                          text-xs
                        "
                      >
                        {formatBooleanBadge(true, mock)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="w-10 shrink-0 text-xs text-muted-foreground"
                      >
                        False
                      </span>
                      <span
                        className="
                          rounded-sm border bg-background px-2 py-0.5 font-mono
                          text-xs
                        "
                      >
                        {formatBooleanBadge(false, mock)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
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
          <form.AppField name="dateTimeAllowYearMonth">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-datetime-allow-year-month`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-datetime-allow-year-month`}>
                  Allow month-only (YYYY-MM) dates
                </Label>
              </div>
            )}
          </form.AppField>
          <QuickFilterRangeFields
            form={form}
            className="space-y-1"
            fields={[
              {
                name: "quickFilterRangeDays",
                label: "Days",
              },
              {
                name: "quickFilterRangeHours",
                label: "Hours",
              },
              {
                name: "quickFilterRangeMinutes",
                label: "Minutes",
              },
              {
                name: "quickFilterRangeSeconds",
                label: "Seconds",
              },
            ]}
          />
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

function ImageFileOptions({
  form,
  idPrefix,
  isImage,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  isImage: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <LabeledSection title="Property options">
        <div className="space-y-4">
          <form.AppField name="showInDetails">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-show-in-details`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-show-in-details`}>Show in detail view</Label>
              </div>
            )}
          </form.AppField>
          <p className="text-xs text-muted-foreground">
            {isImage
              ? "When checked, the uploaded image is shown on the bookmark detail page."
              : "When checked, a download link to the uploaded file is shown on the bookmark detail page."}
          </p>

          {isImage
            ? (
              <>
                <form.AppField name="showInGallery">
                  {field => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-show-in-gallery`}
                        checked={field.state.value}
                        onCheckedChange={checked => field.handleChange(checked === true)}
                      />
                      <Label htmlFor={`${idPrefix}-show-in-gallery`}>Show in Media Management</Label>
                    </div>
                  )}
                </form.AppField>
                <p className="text-xs text-muted-foreground">
                  When checked, images uploaded for this property appear in Media Management and count toward your storage quota.
                </p>
              </>
            )
            : null}
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
  const {
    t,
  } = useTranslation();
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
                    {fieldErrorMessages(field.state.meta.errors).map(m => t(m)).join(", ")}
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

/** The list of selectable levels for a rating scale, low → high (0 included when zero is allowed). */
function ratingLevels(ratingMax: "3" | "5", allowZero: boolean): number[] {
  const max = ratingMax === "3" ? 3 : 5;
  const min = allowZero ? 0 : 1;
  return Array.from({
    length: max - min + 1,
  }, (_, i) => min + i);
}

/** Per-level label editor: one text input per rating level, writing into the `ratingLabels` record. */
function RatingLabelsField({
  form,
  idPrefix,
}: {
  form: PropertyFormApi;
  idPrefix: string;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <form.Subscribe
      selector={state => ({
        ratingMax: state.values.ratingMax,
        ratingAllowZero: state.values.ratingAllowZero,
      })}
    >
      {({
        ratingMax, ratingAllowZero,
      }) => (
        <form.AppField name="ratingLabels">
          {field => (
            <div className="space-y-2">
              <Label>{t("Level labels")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("Optional label for each level, shown as a caption. Leave blank to show the number.")}
              </p>
              {ratingLevels(ratingMax, ratingAllowZero).map(level => (
                <div
                  key={level}
                  className="flex items-center gap-2"
                >
                  <span className="w-5 text-right text-sm text-muted-foreground">{level}</span>
                  <Input
                    id={`${idPrefix}-rating-label-${level}`}
                    value={field.state.value[String(level)] ?? ""}
                    placeholder={t("Label for {{level}}", {
                      level,
                    })}
                    onChange={event => field.handleChange({
                      ...field.state.value,
                      [String(level)]: event.target.value,
                    })}
                  />
                </div>
              ))}
            </div>
          )}
        </form.AppField>
      )}
    </form.Subscribe>
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
              ratingAllowRange: state.values.ratingAllowRange,
              ratingLabelCount: Object.values(state.values.ratingLabels).filter(v => v.trim() !== "").length,
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

          <form.AppField name="ratingAllowRange">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-rating-allow-range`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-rating-allow-range`}>
                  Allow a range (from – to, e.g. Beginner to Advanced)
                </Label>
              </div>
            )}
          </form.AppField>

          <RatingLabelsField
            form={form}
            idPrefix={idPrefix}
          />

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

function SectionsOptions({
  form,
  idPrefix,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <LabeledSection title="Property options">
        <div className="space-y-2">
          <form.AppField name="sectionsTiered">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-sections-tiered`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-sections-tiered`}>Allow sub-items (two tiers)</Label>
              </div>
            )}
          </form.AppField>
          <p className="text-xs text-muted-foreground">
            When checked, each section can contain a nested list of child items (e.g. chapters grouping their videos).
          </p>
        </div>
      </LabeledSection>
    </>
  );
}

/** One media-type override row: the media type picker plus its three optional text segments. */
function ItemInItemsMediaTypeTextRow({
  row, mediaTypeOptions, onChange, onRemove,
}: {
  row: ItemInItemsMediaTypeTextRowValue;
  mediaTypeOptions: TreeComboboxOption[];
  onChange: (row: ItemInItemsMediaTypeTextRowValue) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <TreeCombobox
          aria-label={t("Media type")}
          className="flex-1"
          options={mediaTypeOptions}
          value={row.mediaTypeId || undefined}
          placeholder={t("Pick a media type…")}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          onValueChange={value => onChange({
            ...row,
            mediaTypeId: value ?? "",
          })}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("Remove override")}
          onClick={onRemove}
        >
          ×
        </Button>
      </div>
      <div
        className="
          grid gap-2
          sm:grid-cols-3
        "
      >
        <Input
          placeholder={t("Text before (inherit)")}
          value={row.beforeText}
          onChange={e => onChange({
            ...row,
            beforeText: e.target.value,
          })}
        />
        <Input
          placeholder={t("Text between (inherit)")}
          value={row.betweenText}
          onChange={e => onChange({
            ...row,
            betweenText: e.target.value,
          })}
        />
        <Input
          placeholder={t("Text after, e.g.  modules")}
          value={row.afterText}
          onChange={e => onChange({
            ...row,
            afterText: e.target.value,
          })}
        />
      </div>
    </div>
  );
}

/**
 * The per-media-type text override list for an itemInItems property — how one "Progress" property
 * renders "1 of 10 pages" on a book but "24 of 230 modules" on a course. A segment left blank
 * inherits the base text above.
 */
function ItemInItemsMediaTypeTextsField({
  form,
}: {
  form: PropertyFormApi;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const builtInName = useBuiltInName();
  const mediaTypeOptions = mediaTypeNodesToOptions(mediaTypeTree ?? [], builtInName);
  return (
    <form.AppField name="itemInItemsMediaTypeTexts">
      {field => (
        <div className="space-y-2">
          <Label>{t("Per-media-type text")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Override the text segments for bookmarks of a specific media type. Blank segments inherit the texts above.")}
          </p>
          {field.state.value.map((row, index) => (
            <ItemInItemsMediaTypeTextRow
              // Rows have no stable id; index keying is fine for this small append/remove list.

              key={index}
              row={row}
              mediaTypeOptions={mediaTypeOptions}
              onChange={next => field.handleChange(field.state.value.map((r, i) => (i === index ? next : r)))}
              onRemove={() => field.handleChange(field.state.value.filter((_, i) => i !== index))}
            />
          ))}
          <button
            type="button"
            className="
              text-sm text-primary
              hover:underline
            "
            onClick={() => field.handleChange([...field.state.value, {
              mediaTypeId: "",
              beforeText: "",
              betweenText: "",
              afterText: "",
            }])}
          >
            {t("+ Add media type override")}
          </button>
        </div>
      )}
    </form.AppField>
  );
}

/** The "derive from a Sections property" picker for an itemInItems property. */
function ItemInItemsSourceField({
  form,
}: {
  form: PropertyFormApi;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: customProperties,
  } = useCustomProperties();
  const sectionsOptions = [
    {
      value: "",
      label: t("None (manual entry)"),
    },
    ...(customProperties ?? [])
      .filter(property => property.type === "sections" && property.enabled)
      .map(property => ({
        value: property.id,
        label: property.name,
      })),
  ];
  return (
    <form.AppField name="itemInItemsSourcePropertyId">
      {field => (
        <div className="space-y-1">
          <field.SelectField
            label={t("Derive from Sections completion")}
            options={sectionsOptions}
            placeholder={t("None (manual entry)")}
          />
          <p className="text-xs text-muted-foreground">
            {t("When set, a bookmark's value is computed automatically from that Sections property — completed items of total items — overriding manual entry whenever sections exist.")}
          </p>
        </div>
      )}
    </form.AppField>
  );
}

function ItemInItemsOptions({
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
        description="Configure the text shown before, between, and after the two numbers."
        defaultOpen={defaultOpen}
        preview={(
          <form.Subscribe
            selector={state => ({
              itemInItemsBeforeText: state.values.itemInItemsBeforeText,
              itemInItemsBetweenText: state.values.itemInItemsBetweenText,
              itemInItemsAfterText: state.values.itemInItemsAfterText,
              overrideCount: state.values.itemInItemsMediaTypeTexts.length,
            })}
          >
            {values => summarizeItemInItemsOptions(values)}
          </form.Subscribe>
        )}
      >
        <div className="space-y-4">
          <form.AppField name="itemInItemsBeforeText">
            {field => (
              <field.TextField
                label="Text before current"
                placeholder="e.g. Page (leave blank for none)"
              />
            )}
          </form.AppField>
          <form.AppField name="itemInItemsBetweenText">
            {field => (
              <field.TextField
                label="Text between numbers"
                placeholder="e.g. &#32;of&#32;"
              />
            )}
          </form.AppField>
          <form.AppField name="itemInItemsAfterText">
            {field => (
              <field.TextField
                label="Text after total"
                placeholder="e.g. &#32;pages"
              />
            )}
          </form.AppField>
          <ItemInItemsMediaTypeTextsField form={form} />
          <ItemInItemsSourceField form={form} />
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
