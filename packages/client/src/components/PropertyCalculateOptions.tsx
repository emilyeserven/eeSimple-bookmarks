import type { PropertyFormApi } from "./propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { OperandCheckboxList, toggleId } from "./propertyFormParts";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fieldErrorMessages } from "@/lib/form";

export function CalculateOperands({
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
