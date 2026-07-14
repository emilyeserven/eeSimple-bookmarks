import type { PropertyFormApi } from "./propertyFormSchema";

import { AllowDefaultField } from "./AllowDefaultField";
import { LabeledSection } from "./LabeledSection";
import { DATE_TIME_FORMAT_OPTIONS } from "./propertyFormParts";
import { QuickFilterRangeFields } from "./PropertyQuickFilterRange";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function DateTimeOptions({
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
