import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { FillTarget } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect } from "./controls";
import { Combobox } from "../Combobox";

import { coerceFillTarget } from "@/lib/extensionFillForm";

type FieldName = Extract<FillTarget, { kind: "field" }>["field"];
type TaxonomyName = Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];

/** The `kind` select plus the variant-specific value control for a rule's {@link FillTarget}. */
export function FillTargetPicker({
  target, propertyOptions, onChange,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
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
        onChange={onChange}
      />
    </div>
  );
}

/** The value control for the currently-selected target kind. */
function FillTargetValue({
  target, propertyOptions, onChange,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
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
        <Combobox
          aria-label={t("Custom property")}
          options={propertyOptions}
          value={target.propertyId || undefined}
          placeholder={t("Select a property")}
          emptyText={t("No properties found.")}
          onValueChange={value => onChange({
            kind: "customProperty",
            propertyId: value ?? "",
          })}
        />
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
