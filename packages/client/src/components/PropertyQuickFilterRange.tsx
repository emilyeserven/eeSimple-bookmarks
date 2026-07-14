import type { PropertyFormApi } from "./propertyFormSchema";

import { Label } from "@/components/ui/label";

export const QUICK_FILTER_RANGE_HINT
  = "When set, the magnifying-glass quick filter on a bookmark spans the value plus and minus this "
    + "amount instead of matching it exactly. Leave blank for an exact match.";

export type QuickFilterRangeFieldName
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
export function QuickFilterRangeFields({
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
