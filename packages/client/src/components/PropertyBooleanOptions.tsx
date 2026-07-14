import type { PropertyFormApi } from "./propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { BOOLEAN_LABEL_PRESET_OPTIONS, summarizeBooleanOptions } from "./propertyFormParts";

import { Separator } from "@/components/ui/separator";
import { formatBooleanBadge } from "@/lib/bookmarkFormat";

export function BooleanOptions({
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
