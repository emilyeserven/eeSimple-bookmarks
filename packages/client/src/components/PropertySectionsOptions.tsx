import type { PropertyFormApi } from "./propertyFormSchema";

import { LabeledSection } from "./LabeledSection";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SectionsOptions({
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
