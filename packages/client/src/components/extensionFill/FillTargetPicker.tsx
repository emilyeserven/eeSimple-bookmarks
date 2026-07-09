import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillTarget } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect } from "./controls";
import { Combobox } from "../Combobox";

import { coerceFillTarget } from "@/lib/extensionFillForm";

type FieldName = Extract<FillTarget, { kind: "field" }>["field"];
type TaxonomyName = Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];
type SubField = "current" | "total";

/** The `kind` select plus the variant-specific value control for a rule's {@link FillTarget}. */
export function FillTargetPicker({
  target, propertyOptions, propertiesById, onChange,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <KindSelect
        label={t("Target")}
        value={target.kind}
        options={[
          {
            value: "field",
            label: t("Bookmark field"),
          },
          {
            value: "customProperty",
            label: t("Custom property"),
          },
          {
            value: "taxonomy",
            label: t("Taxonomy"),
          },
        ]}
        onValueChange={kind => onChange(coerceFillTarget(kind, target))}
      />
      <FillTargetValue
        target={target}
        propertyOptions={propertyOptions}
        propertiesById={propertiesById}
        onChange={onChange}
      />
    </div>
  );
}

/** The value control for the currently-selected target kind. */
function FillTargetValue({
  target, propertyOptions, propertiesById, onChange,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  switch (target.kind) {
    case "field":
      return (
        <KindSelect<FieldName>
          label={t("Field")}
          value={target.field}
          options={FIELD_OPTIONS(t)}
          onValueChange={field => onChange({
            kind: "field",
            field,
          })}
        />
      );
    case "customProperty":
      return (
        <div className="space-y-2">
          <Combobox
            aria-label={t("Custom property")}
            options={propertyOptions}
            value={target.propertyId || undefined}
            placeholder={t("Select a property")}
            emptyText={t("No properties found.")}
            onValueChange={value => onChange({
              // Swapping the property resets any per-value sub-selection (it may no longer apply).
              kind: "customProperty",
              propertyId: value ?? "",
            })}
          />
          <CustomPropertySubValue
            target={target}
            property={propertiesById.get(target.propertyId)}
            onChange={onChange}
          />
        </div>
      );
    case "taxonomy":
      return (
        <KindSelect<TaxonomyName>
          label={t("Taxonomy")}
          value={target.taxonomy}
          options={TAXONOMY_OPTIONS(t)}
          onValueChange={taxonomy => onChange({
            kind: "taxonomy",
            taxonomy,
          })}
        />
      );
  }
}

/**
 * For a multi-value property, a sub-value selector: Two-Numbers (`itemInItems`) → Current/Total;
 * Choices → which option. Other property types (and while none is selected) render nothing.
 */
function CustomPropertySubValue({
  target, property, onChange,
}: {
  target: Extract<FillTarget, { kind: "customProperty" }>;
  property: CustomProperty | undefined;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (property?.type === "itemInItems") {
    return (
      <KindSelect<SubField>
        label={t("Value")}
        value={target.subField ?? "current"}
        options={[
          {
            value: "current",
            label: t("Current"),
          },
          {
            value: "total",
            label: t("Total"),
          },
        ]}
        onValueChange={subField => onChange({
          kind: "customProperty",
          propertyId: target.propertyId,
          subField,
        })}
      />
    );
  }
  if (property?.type === "choices") {
    return (
      <Combobox
        aria-label={t("Option")}
        options={property.choicesItems.map(item => ({
          value: item.value,
          label: item.label,
        }))}
        value={target.choiceValue || undefined}
        placeholder={t("Select an option")}
        emptyText={t("No options found.")}
        onValueChange={value => onChange({
          kind: "customProperty",
          propertyId: target.propertyId,
          choiceValue: value ?? "",
        })}
      />
    );
  }
  return null;
}

function FIELD_OPTIONS(t: (key: string) => string): KindOption<FieldName>[] {
  return [
    {
      value: "title",
      label: t("Title"),
    },
    {
      value: "description",
      label: t("Description"),
    },
    {
      value: "isbn",
      label: t("ISBN"),
    },
    {
      value: "year",
      label: t("Year"),
    },
  ];
}

function TAXONOMY_OPTIONS(t: (key: string) => string): KindOption<TaxonomyName>[] {
  return [
    {
      value: "people",
      label: t("People"),
    },
    {
      value: "groups",
      label: t("Groups"),
    },
    {
      value: "locations",
      label: t("Locations"),
    },
    {
      value: "tags",
      label: t("Tags"),
    },
  ];
}
