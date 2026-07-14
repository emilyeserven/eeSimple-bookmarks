import type { PropertyFormApi } from "./propertyFormSchema";

import { useTranslation } from "react-i18next";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { RATING_DISPLAY_OPTIONS, RATING_MAX_OPTIONS, summarizeRatingOptions } from "./propertyFormParts";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
