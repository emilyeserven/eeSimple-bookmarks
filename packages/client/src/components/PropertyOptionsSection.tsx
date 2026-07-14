import type { PropertyFormApi, PropertyFormSection } from "./propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { BooleanOptions } from "./PropertyBooleanOptions";
import { CalculateOperands } from "./PropertyCalculateOptions";
import { ChoicesOptions } from "./PropertyChoicesOptions";
import { DateTimeOptions } from "./PropertyDateTimeOptions";
import { ImageFileOptions } from "./PropertyImageFileOptions";
import { ItemInItemsOptions } from "./PropertyItemInItemsOptions";
import { NumberOptions } from "./PropertyNumberOptions";
import { RatingOptions } from "./PropertyRatingOptions";
import { SectionsOptions } from "./PropertySectionsOptions";

interface PropertyOptionsSectionProps {
  form: PropertyFormApi;
  idPrefix: string;
  mode: "create" | "edit";
  /** Number properties offered as Calculate operands (excludes the property being edited). */
  numberProperties: CustomProperty[];
  /** Set when rendering a single edit tab; controls separators and the collapsible's default state. */
  section?: PropertyFormSection;
  /** True when rendering the whole form, gating the leading `<Separator />`. */
  full: boolean;
}

/**
 * The type-specific "Property options" section of the property form. Subscribes to the current Type
 * once and renders the matching options (number/boolean/datetime/calculate). Operates on the shared
 * form instance passed in. Extracted so `PropertyForm` keeps a lean top-level structure; each
 * per-type options body lives in its own `Property<Type>Options` module.
 */
export function PropertyOptionsSection({
  form,
  idPrefix,
  mode,
  numberProperties,
  section,
  full,
}: PropertyOptionsSectionProps) {
  const defaultOpen = mode === "create" || section === "options";
  return (
    <form.Subscribe selector={state => state.values.type}>
      {(type) => {
        if (type === "number") {
          return (
            <NumberOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "boolean") {
          return (
            <BooleanOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "datetime") {
          return (
            <DateTimeOptions
              form={form}
              idPrefix={idPrefix}
              mode={mode}
              full={full}
            />
          );
        }
        if (type === "calculate") {
          return (
            <CalculateOperands
              form={form}
              numberProperties={numberProperties}
              full={full}
            />
          );
        }
        if (type === "ratingScale") {
          return (
            <RatingOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "image" || type === "file") {
          return (
            <ImageFileOptions
              form={form}
              idPrefix={idPrefix}
              isImage={type === "image"}
              full={full}
            />
          );
        }
        if (type === "choices") {
          return (
            <ChoicesOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "itemInItems") {
          return (
            <ItemInItemsOptions
              form={form}
              idPrefix={idPrefix}
              defaultOpen={defaultOpen}
              full={full}
            />
          );
        }
        if (type === "sections") {
          return (
            <SectionsOptions
              form={form}
              idPrefix={idPrefix}
              full={full}
            />
          );
        }
        return null;
      }}
    </form.Subscribe>
  );
}
