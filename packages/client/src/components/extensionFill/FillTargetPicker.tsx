import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillTarget, TaxonomyEntityAssociation, TaxonomyEntityFieldKey } from "@eesimple/types";

import { useId } from "react";

import {
  SOCIAL_MEDIA_PLATFORM_LABELS,
  SOCIAL_MEDIA_PLATFORMS,
  TAXONOMY_ENTITY_ASSOCIATIONS,
  TAXONOMY_ENTITY_FIELD_LABELS,
  TAXONOMY_ENTITY_SPECS,
} from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { KindSelect, LabeledInput } from "./controls";
import { Combobox } from "../Combobox";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

import { coerceFillTarget } from "@/lib/extensionFillForm";

type FieldName = Extract<FillTarget, { kind: "field" }>["field"];
type TaxonomyName = Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];
type TaxonomyEntityTarget = Extract<FillTarget, { kind: "taxonomyEntity" }>;
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
          {
            value: "publisher",
            label: t("Publisher"),
          },
          {
            value: "image",
            label: t("Image"),
          },
          {
            value: "taxonomyEntity",
            label: t("Associated taxonomy"),
          },
          {
            value: "sections",
            label: t("Sections"),
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
    case "publisher":
      // No value control — a publisher target resolves the extracted name to the bookmark's Group.
      return null;
    case "image":
      return (
        <SetMainImageToggle
          checked={target.setMain ?? false}
          onChange={setMain => onChange({
            kind: "image",
            setMain,
          })}
        />
      );
    case "taxonomyEntity":
      return (
        <TaxonomyEntityTarget
          target={target}
          onChange={onChange}
        />
      );
    case "sections":
      return (
        <SectionsTarget
          target={target}
          propertiesById={propertiesById}
          onChange={onChange}
        />
      );
  }
}

type SectionsTarget = Extract<FillTarget, { kind: "sections" }>;
type SectionEntryTypeName = SectionsTarget["entryType"];

/**
 * Controls for a `sections` target: pick the sections-typed property + the entry type. For url/page
 * the optional container/header/item-name selectors build a two-tier value (blank container = flat);
 * for timestamp those are hidden (the selector's text is parsed for `m:ss` lines).
 */
function SectionsTarget({
  target, propertiesById, onChange,
}: {
  target: SectionsTarget;
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  const sectionsOptions: ComboboxOption[] = [...propertiesById.values()]
    .filter(property => property.type === "sections")
    .map(property => ({
      value: property.id,
      label: property.name,
    }));
  const isTimestamp = target.entryType === "timestamp";
  return (
    <div className="space-y-2">
      <Combobox
        aria-label={t("Sections property")}
        options={sectionsOptions}
        value={target.propertyId || undefined}
        placeholder={t("Select a property")}
        emptyText={t("No sections properties found.")}
        onValueChange={value => onChange({
          ...target,
          propertyId: value ?? "",
        })}
      />
      <KindSelect<SectionEntryTypeName>
        label={t("Entry type")}
        value={target.entryType}
        options={[
          {
            value: "url",
            label: t("URL"),
          },
          {
            value: "page",
            label: t("Page"),
          },
          {
            value: "timestamp",
            label: t("Timestamp"),
          },
        ]}
        onValueChange={entryType => onChange({
          ...target,
          entryType,
        })}
      />
      {isTimestamp
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Selector should match the element whose text holds the timestamps (e.g. a video description). Each m:ss / h:mm:ss line becomes an entry.")}
          </p>
        )
        : (
          <>
            <LabeledInput
              label={t("Group container selector")}
              placeholder=".MuiAccordion-root"
              value={target.container ?? ""}
              onChange={container => onChange({
                ...target,
                container,
              })}
            />
            <LabeledInput
              label={t("Group header selector")}
              placeholder="h3"
              value={target.header ?? ""}
              onChange={header => onChange({
                ...target,
                header,
              })}
            />
            <LabeledInput
              label={t("Item name selector")}
              placeholder="p"
              value={target.itemName ?? ""}
              onChange={itemName => onChange({
                ...target,
                itemName,
              })}
            />
            <LabeledInput
              label={t("Item URL selector")}
              placeholder="a"
              value={target.itemUrl ?? ""}
              onChange={itemUrl => onChange({
                ...target,
                itemUrl,
              })}
            />
            <p className="text-xs text-muted-foreground">
              {t("Leave the container blank for a flat list. The main Selector matches each item. With an Item URL selector, the item can be a wrapper and Item name / Item URL read from inside it; leave it blank to read the value off the item via Read/Transform.")}
            </p>
          </>
        )}
    </div>
  );
}

/**
 * Controls for an "Associated taxonomy" target: pick the linked taxonomy, then one of its writable
 * fields, then (for a social link) the platform. Switching the taxonomy resets the field when the
 * previous one doesn't apply to the new entity.
 */
function TaxonomyEntityTarget({
  target, onChange,
}: {
  target: TaxonomyEntityTarget;
  onChange: (target: FillTarget) => void;
}) {
  const {
    t,
  } = useTranslation();
  const fields = TAXONOMY_ENTITY_SPECS[target.association].fields;
  return (
    <div className="space-y-2">
      <KindSelect<TaxonomyEntityAssociation>
        label={t("Taxonomy")}
        value={target.association}
        options={TAXONOMY_ENTITY_ASSOCIATIONS.map(association => ({
          value: association,
          label: t(TAXONOMY_ENTITY_SPECS[association].label),
        }))}
        onValueChange={(association) => {
          // Keep the current field if the new entity supports it, else fall back to its first field.
          const nextFields: readonly TaxonomyEntityFieldKey[] = TAXONOMY_ENTITY_SPECS[association].fields;
          const field = nextFields.includes(target.field) ? target.field : nextFields[0];
          onChange({
            kind: "taxonomyEntity",
            association,
            field,
          });
        }}
      />
      <KindSelect<TaxonomyEntityFieldKey>
        label={t("Field")}
        value={target.field}
        options={fields.map(field => ({
          value: field,
          label: t(TAXONOMY_ENTITY_FIELD_LABELS[field]),
        }))}
        onValueChange={field => onChange({
          kind: "taxonomyEntity",
          association: target.association,
          field,
        })}
      />
      {target.field === "socialLink"
        ? (
          <Combobox
            aria-label={t("Platform")}
            options={SOCIAL_MEDIA_PLATFORMS.map(platform => ({
              value: platform,
              label: SOCIAL_MEDIA_PLATFORM_LABELS[platform],
            }))}
            value={target.socialPlatform || undefined}
            placeholder={t("Select a platform")}
            emptyText={t("No platforms found.")}
            onValueChange={value => onChange({
              kind: "taxonomyEntity",
              association: target.association,
              field: "socialLink",
              ...(value
                ? {
                  socialPlatform: value as TaxonomyEntityTarget["socialPlatform"],
                }
                : {}),
            })}
          />
        )
        : null}
    </div>
  );
}

/** "Set as main image" toggle for an image target — grabs the image and makes it the primary one. */
function SetMainImageToggle({
  checked, onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  const id = useId();
  return (
    <div className="flex items-center gap-2 pt-6">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onChange(value === true)}
      />
      <Label htmlFor={id}>{t("Set as main image")}</Label>
    </div>
  );
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
