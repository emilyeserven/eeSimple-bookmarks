import type { ComboboxOption } from "./Combobox";
import type { PropertyFormApi, PropertyFormValues } from "./propertyFormSchema";

import { clampRatingMax, RATING_MAX_LIMIT, RATING_MAX_MIN } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { Combobox } from "./Combobox";
import { RATING_DISPLAY_OPTIONS, summarizeRatingOptions } from "./propertyFormParts";
import { useCategories } from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { categoryComboboxOptions } from "@/lib/comboboxOptions";

/** The list of selectable levels for a rating scale, low → high (0 included when zero is allowed). */
function ratingLevels(ratingMax: string, allowZero: boolean): number[] {
  const max = clampRatingMax(Number(ratingMax.trim()));
  const min = allowZero ? 0 : 1;
  return Array.from({
    length: max - min + 1,
  }, (_, i) => min + i);
}

/** One text input per rating level, writing into a level-keyed label record (base or override). */
function RatingLevelLabelInputs({
  levels,
  values,
  idPrefix,
  placeholderFor,
  onChange,
}: {
  levels: number[];
  values: Record<string, string>;
  idPrefix: string;
  placeholderFor: (level: number) => string;
  onChange: (values: Record<string, string>) => void;
}) {
  return (
    <>
      {levels.map(level => (
        <div
          key={level}
          className="flex items-center gap-2"
        >
          <span className="w-5 text-right text-sm text-muted-foreground">{level}</span>
          <Input
            id={`${idPrefix}-rating-label-${level}`}
            value={values[String(level)] ?? ""}
            placeholder={placeholderFor(level)}
            onChange={event => onChange({
              ...values,
              [String(level)]: event.target.value,
            })}
          />
        </div>
      ))}
    </>
  );
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
              <RatingLevelLabelInputs
                levels={ratingLevels(ratingMax, ratingAllowZero)}
                values={field.state.value}
                idPrefix={idPrefix}
                placeholderFor={level => t("Label for {{level}}", {
                  level,
                })}
                onChange={value => field.handleChange(value)}
              />
            </div>
          )}
        </form.AppField>
      )}
    </form.Subscribe>
  );
}

/** One editable per-category label override row (the form's array element shape). */
type RatingCategoryLabelsRowValue = PropertyFormValues["ratingCategoryLabels"][number];

/** One category override row: the category picker plus its per-level label inputs. */
function RatingCategoryLabelsRow({
  row, levels, baseLabels, categoryOptions, idPrefix, onChange, onRemove,
}: {
  row: RatingCategoryLabelsRowValue;
  levels: number[];
  baseLabels: Record<string, string>;
  categoryOptions: ComboboxOption[];
  idPrefix: string;
  onChange: (row: RatingCategoryLabelsRowValue) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Combobox
          aria-label={t("Category")}
          className="flex-1"
          options={categoryOptions}
          value={row.categoryId || undefined}
          placeholder={t("Pick a category…")}
          searchPlaceholder={t("Search categories…")}
          emptyText={t("No categories found.")}
          onValueChange={value => onChange({
            ...row,
            categoryId: value ?? "",
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
      <RatingLevelLabelInputs
        levels={levels}
        values={row.labels}
        idPrefix={idPrefix}
        // Show the base label the level inherits (else its number) so the fallback is visible.
        placeholderFor={level => baseLabels[String(level)]?.trim() || String(level)}
        onChange={labels => onChange({
          ...row,
          labels,
        })}
      />
    </div>
  );
}

/**
 * The per-category label override list for a ratingScale property — how one property can read
 * "N5…N1" for a Japanese category but "Beginner…Advanced" elsewhere while storing the same numeric
 * levels (so filtering stays unified). A level left blank inherits the base label above.
 */
function RatingCategoryLabelsField({
  form,
  idPrefix,
}: {
  form: PropertyFormApi;
  idPrefix: string;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories,
  } = useCategories();
  const categoryOptions = categoryComboboxOptions(categories ?? []);
  return (
    <form.Subscribe
      selector={state => ({
        ratingMax: state.values.ratingMax,
        ratingAllowZero: state.values.ratingAllowZero,
        ratingLabels: state.values.ratingLabels,
      })}
    >
      {({
        ratingMax, ratingAllowZero, ratingLabels,
      }) => (
        <form.AppField name="ratingCategoryLabels">
          {field => (
            <div className="space-y-2">
              <Label>{t("Per-category labels")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("Override the level labels for bookmarks in a specific category. Blank levels inherit the labels above.")}
              </p>
              {field.state.value.map((row, index) => (
                <RatingCategoryLabelsRow
                  // Rows have no stable id; index keying is fine for this small append/remove list.

                  key={index}
                  row={row}
                  levels={ratingLevels(ratingMax, ratingAllowZero)}
                  baseLabels={ratingLabels}
                  // Hide categories already overridden by other rows so each appears at most once.
                  categoryOptions={categoryOptions.filter(option =>
                    option.value === row.categoryId
                    || !field.state.value.some(other => other.categoryId === option.value))}
                  idPrefix={`${idPrefix}-rating-category-${index}`}
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
                  categoryId: "",
                  labels: {},
                }])}
              >
                {t("+ Add category override")}
              </button>
            </div>
          )}
        </form.AppField>
      )}
    </form.Subscribe>
  );
}

export function RatingOptions({
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
              ratingCategoryOverrideCount: state.values.ratingCategoryLabels.length,
              ratingDisplay: state.values.ratingDisplay,
              ratingRangeIncludeStart: state.values.ratingRangeIncludeStart,
            })}
          >
            {values => summarizeRatingOptions(values)}
          </form.Subscribe>
        )}
      >
        <div className="space-y-4">
          <form.AppField name="ratingDisplay">
            {field => (
              <field.SelectField
                label="Display"
                options={RATING_DISPLAY_OPTIONS}
              />
            )}
          </form.AppField>

          <form.AppField name="ratingMax">
            {field => (
              <div className="space-y-1">
                <field.TextField
                  label="Scale (highest level)"
                  type="number"
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  {`${RATING_MAX_MIN}–${RATING_MAX_LIMIT}`}
                </p>
              </div>
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

          <form.Subscribe selector={state => state.values.ratingAllowRange}>
            {allowRange =>
              allowRange
                ? (
                  <form.AppField name="ratingRangeIncludeStart">
                    {field => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${idPrefix}-rating-range-include-start`}
                          checked={field.state.value}
                          onCheckedChange={checked => field.handleChange(checked === true)}
                        />
                        <Label htmlFor={`${idPrefix}-rating-range-include-start`}>
                          Include the start level in the range fill (3–5 fills 3,4,5)
                        </Label>
                      </div>
                    )}
                  </form.AppField>
                )
                : null}
          </form.Subscribe>

          <RatingLabelsField
            form={form}
            idPrefix={idPrefix}
          />

          <RatingCategoryLabelsField
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
