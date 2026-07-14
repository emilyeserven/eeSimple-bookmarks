import type { PropertyFormApi } from "./propertyFormSchema";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { NUMBER_FORMAT_OPTIONS, summarizeNumberOptions } from "./propertyFormParts";
import { QuickFilterRangeFields } from "./PropertyQuickFilterRange";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function NumberOptions({
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
