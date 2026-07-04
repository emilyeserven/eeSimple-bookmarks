import type { PropertyFormApi } from "./propertyFormSchema";

import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AllowDefaultFieldProps {
  form: PropertyFormApi;
  idPrefix: string;
  /** Class for the wrapping element (sections vary between a grid span and a plain block). */
  className: string;
}

/**
 * The "Allow default value" checkbox plus its hint, shared by the number/boolean/datetime options
 * sections. Operates on the shared property form instance passed in.
 */
export function AllowDefaultField({
  form,
  idPrefix,
  className,
}: AllowDefaultFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className={className}>
      <form.AppField name="allowDefault">
        {field => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-allow-default`}
              checked={field.state.value}
              onCheckedChange={checked => field.handleChange(checked === true)}
            />
            <Label htmlFor={`${idPrefix}-allow-default`}>{t("Allow default value")}</Label>
          </div>
        )}
      </form.AppField>
      <p className="text-xs text-muted-foreground">
        {t("When disabled, this property will not appear in the category defaults editor.")}
      </p>
    </div>
  );
}
