import type { CustomProperty } from "@eesimple/types";

import { z } from "zod";

import { OperandCheckboxList } from "./PropertyFormFields";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";
import { toggleId } from "../lib/propertyForm";
import { DATE_TIME_FORMAT_LABELS } from "../lib/propertyFormat";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PropertyOptionsFormProps {
  property: CustomProperty;
  /** Number properties offered as Calculate operands (excludes the property being edited). */
  numberProperties: CustomProperty[];
}

/** The "Options" edit tab — type-specific. Boolean properties have no options and don't render this. */
export function PropertyOptionsForm({
  property, numberProperties,
}: PropertyOptionsFormProps) {
  switch (property.type) {
    case "number":
      return <NumberOptionsForm property={property} />;
    case "calculate":
      return (
        <CalculateOptionsForm
          property={property}
          numberProperties={numberProperties}
        />
      );
    case "datetime":
      return (
        <div className="space-y-1">
          <Label>Captures</Label>
          <p className="text-sm text-muted-foreground">
            {DATE_TIME_FORMAT_LABELS[property.dateTimeFormat ?? "date"]}
            {" — set at creation and can't be changed."}
          </p>
        </div>
      );
    default:
      return null;
  }
}

const numberSchema = z.object({
  numberMin: z.string(),
  numberMax: z.string(),
  disableMin: z.boolean(),
  disableMax: z.boolean(),
  unitSingular: z.string(),
  unitPlural: z.string(),
  valuePrefix: z.string(),
  zeroLabel: z.string(),
  maxLabel: z.string(),
});

/** Slider range, units, and labels for a Number property. */
function NumberOptionsForm({
  property,
}: {
  property: CustomProperty;
}) {
  const updateProperty = useUpdateCustomProperty();

  const form = useAppForm({
    defaultValues: {
      numberMin: property.numberMin === null ? "0" : String(property.numberMin),
      numberMax: property.numberMax === null ? "100" : String(property.numberMax),
      disableMin: property.numberMin === null,
      disableMax: property.numberMax === null,
      unitSingular: property.unitSingular ?? "",
      unitPlural: property.unitPlural ?? "",
      valuePrefix: property.valuePrefix ?? "",
      zeroLabel: property.zeroLabel ?? "",
      maxLabel: property.maxLabel ?? "",
    },
    validators: {
      onChange: numberSchema,
    },
    onSubmit: ({
      value,
    }) => {
      const trimOrNull = (input: string): string | null => (input.trim() ? input.trim() : null);
      updateProperty.mutate({
        id: property.id,
        input: {
          numberMin: value.disableMin ? null : Number(value.numberMin),
          numberMax: value.disableMax ? null : Number(value.numberMax),
          unitSingular: trimOrNull(value.unitSingular),
          unitPlural: trimOrNull(value.unitPlural),
          valuePrefix: trimOrNull(value.valuePrefix),
          zeroLabel: trimOrNull(value.zeroLabel),
          maxLabel: trimOrNull(value.maxLabel),
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
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
      </div>

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>
      {updateProperty.isError
        ? <p className="text-sm text-destructive">{updateProperty.error.message}</p>
        : null}
    </form>
  );
}

const calculateSchema = z
  .object({
    operandIds: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.operandIds.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least two Number properties.",
        path: ["operandIds"],
      });
    }
  });

/** The Number properties a Calculate property sums. */
function CalculateOptionsForm({
  property, numberProperties,
}: {
  property: CustomProperty;
  numberProperties: CustomProperty[];
}) {
  const updateProperty = useUpdateCustomProperty();

  const form = useAppForm({
    defaultValues: {
      operandIds: property.operandPropertyIds,
    },
    validators: {
      onChange: calculateSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateProperty.mutate({
        id: property.id,
        input: {
          operandPropertyIds: value.operandIds,
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
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

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>
      {updateProperty.isError
        ? <p className="text-sm text-destructive">{updateProperty.error.message}</p>
        : null}
    </form>
  );
}
