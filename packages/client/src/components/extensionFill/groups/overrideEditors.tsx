import type { OverrideEditorProps } from "./overrideMeta";
import type { ComboboxOption } from "../../Combobox";
import type { EntityResolution, OverrideKey, PathMatch, SectionsLayoutOverride, TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec } from "@eesimple/types";
import type { ComponentType } from "react";

import {
  SECTION_ENTRY_TYPES,
  SOCIAL_MEDIA_PLATFORM_LABELS,
  SOCIAL_MEDIA_PLATFORMS,
  TAXONOMY_ENTITY_ASSOCIATIONS,
  TAXONOMY_ENTITY_FIELD_LABELS,
  TAXONOMY_ENTITY_SPECS,
} from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { Combobox } from "../../Combobox";
import { KindSelect, LabeledInput } from "../controls";

import { taxonomyEntityFieldLabel, taxonomyEntityWriteKeys } from "@/lib/extensionFillForm";

const SOCIAL_OPTIONS: ComboboxOption[] = SOCIAL_MEDIA_PLATFORMS.map(platform => ({
  value: platform,
  label: SOCIAL_MEDIA_PLATFORM_LABELS[platform],
}));

function PathMatchEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  const pathMatch = value as PathMatch;
  return (
    <div
      className="
        grid gap-2
        sm:grid-cols-2
      "
    >
      <KindSelect
        label={t("Path match")}
        value={pathMatch.mode}
        options={[
          {
            value: "prefix",
            label: t("Starts with"),
          },
          {
            value: "contains",
            label: t("Contains"),
          },
          {
            value: "suffix",
            label: t("Ends with"),
          },
          {
            value: "regex",
            label: t("Matches regex"),
          },
        ]}
        onValueChange={mode => onChange({
          ...pathMatch,
          mode,
        })}
      />
      <LabeledInput
        label={t("Path value")}
        placeholder="/course/"
        value={pathMatch.value}
        onChange={next => onChange({
          ...pathMatch,
          value: next,
        })}
      />
    </div>
  );
}

function TargetKindEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Target kind")}
      value={value as string}
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
          label: t("This bookmark's taxonomy (multi)"),
        },
        {
          value: "image",
          label: t("Image"),
        },
        {
          value: "taxonomyEntity",
          label: t("A linked term's field"),
        },
        {
          value: "taxonomyDirect",
          label: t("An entity from this page"),
        },
        {
          value: "sections",
          label: t("Sections"),
        },
      ]}
      onValueChange={onChange}
    />
  );
}

function FieldFieldEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Bookmark field")}
      value={value as string}
      options={[
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
      ]}
      onValueChange={onChange}
    />
  );
}

function PropertyIdEditor({
  value, onChange, propertyOptions,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Combobox
      aria-label={t("Custom property")}
      options={propertyOptions}
      value={(value as string) || undefined}
      placeholder={t("Select a property")}
      emptyText={t("No properties found.")}
      onValueChange={next => onChange(next ?? "")}
    />
  );
}

function SubFieldEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Value")}
      value={value as string}
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
      onValueChange={onChange}
    />
  );
}

function ChoiceValueEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledInput
      label={t("Choice value")}
      value={value as string}
      onChange={onChange}
      hint={t("The stored value of the choices option to fill.")}
    />
  );
}

function TaxonomyEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Taxonomy")}
      value={value as string}
      options={[
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
      ]}
      onValueChange={onChange}
    />
  );
}

function SetMainEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Set as main image")}
      value={value === true ? "true" : "false"}
      options={[
        {
          value: "true",
          label: t("Yes"),
        },
        {
          value: "false",
          label: t("No"),
        },
      ]}
      onValueChange={next => onChange(next === "true")}
    />
  );
}

const ASSOCIATION_OPTIONS = (t: (key: string) => string): ComboboxOption[] =>
  TAXONOMY_ENTITY_ASSOCIATIONS.map(association => ({
    value: association,
    label: t(TAXONOMY_ENTITY_SPECS[association].label),
  }));

function EntityAssociationEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Linked taxonomy")}
      value={value as string}
      options={ASSOCIATION_OPTIONS(t)}
      onValueChange={onChange}
    />
  );
}

function EntityFieldEditor({
  value, onChange, overrides,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  const association = (overrides["taxonomyEntity.association"] ?? "website") as TaxonomyEntityAssociation;
  return (
    <KindSelect
      label={t("Field")}
      value={value as string}
      options={taxonomyEntityWriteKeys(association).map(field => ({
        value: field,
        label: t(taxonomyEntityFieldLabel(field)),
      }))}
      onValueChange={onChange}
    />
  );
}

function SocialPlatformEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Combobox
      aria-label={t("Platform")}
      options={SOCIAL_OPTIONS}
      value={(value as string) || undefined}
      placeholder={t("Select a platform")}
      emptyText={t("No platforms found.")}
      onValueChange={next => onChange(next ?? SOCIAL_MEDIA_PLATFORMS[0])}
    />
  );
}

function DirectAssociationEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Page entity taxonomy")}
      value={value as string}
      options={ASSOCIATION_OPTIONS(t)}
      onValueChange={onChange}
    />
  );
}

function DirectResolveEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  const resolve = value as EntityResolution;
  return (
    <div className="space-y-2">
      <KindSelect
        label={t("Resolve entity by")}
        value={resolve.mode}
        options={[
          {
            value: "url",
            label: t("Page URL"),
          },
          {
            value: "match",
            label: t("Scraped name"),
          },
        ]}
        onValueChange={mode => onChange(mode === "url"
          ? {
            mode: "url",
          }
          : {
            mode: "match",
            select: {
              selector: "",
            },
          })}
      />
      {resolve.mode === "match"
        ? (
          <LabeledInput
            label={t("Entity name selector")}
            placeholder="h1.entry-title"
            value={resolve.select.selector ?? ""}
            onChange={selector => onChange({
              mode: "match",
              select: {
                ...resolve.select,
                selector,
              },
            })}
          />
        )
        : null}
    </div>
  );
}

function DirectFieldEditor({
  value, onChange, overrides,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  const association = (overrides["taxonomyDirect.association"] ?? "website") as TaxonomyEntityAssociation;
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  const fields = spec.image ? [...spec.fields, "image" as const] : [...spec.fields];
  return (
    <KindSelect
      label={t("Field")}
      value={value as string}
      options={fields.map(field => ({
        value: field,
        label: t(TAXONOMY_ENTITY_FIELD_LABELS[field]),
      }))}
      onValueChange={onChange}
    />
  );
}

function SectionsPropertyEditor({
  value, onChange, sectionsOptions,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Combobox
      aria-label={t("Sections property")}
      options={sectionsOptions}
      value={(value as string) || undefined}
      placeholder={t("Select a property")}
      emptyText={t("No sections properties found.")}
      onValueChange={next => onChange(next ?? "")}
    />
  );
}

function SectionsEntryTypeEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  return (
    <KindSelect
      label={t("Entry type")}
      value={value as string}
      options={SECTION_ENTRY_TYPES.map(entryType => ({
        value: entryType,
        label: entryType,
      }))}
      onValueChange={onChange}
    />
  );
}

function SectionsLayoutEditor({
  value, onChange,
}: OverrideEditorProps) {
  const {
    t,
  } = useTranslation();
  const layout = value as SectionsLayoutOverride;
  const set = (patch: Partial<SectionsLayoutOverride>) => onChange({
    ...layout,
    ...patch,
  });
  return (
    <div className="space-y-2">
      <LabeledInput
        label={t("Section container selector")}
        value={layout.container ?? ""}
        onChange={container => set({
          container,
        })}
      />
      <LabeledInput
        label={t("Section name selector")}
        value={layout.header ?? ""}
        onChange={header => set({
          header,
        })}
      />
      <LabeledInput
        label={t("Section header selector")}
        value={layout.sectionHeaderSelector ?? ""}
        onChange={sectionHeaderSelector => set({
          sectionHeaderSelector,
        })}
      />
      <LabeledInput
        label={t("Item name selector")}
        value={layout.itemName ?? ""}
        onChange={itemName => set({
          itemName,
        })}
      />
      <LabeledInput
        label={t("Item link selector")}
        value={layout.itemUrl ?? ""}
        onChange={itemUrl => set({
          itemUrl,
        })}
      />
    </div>
  );
}

/** Registry of per-key value editors — a missing key fails `tsc` (exhaustive `Record`). */
const OVERRIDE_EDITORS: Record<OverrideKey, ComponentType<OverrideEditorProps>> = {
  "pathMatch": PathMatchEditor,
  "target.kind": TargetKindEditor,
  "field.field": FieldFieldEditor,
  "customProperty.propertyId": PropertyIdEditor,
  "customProperty.subField": SubFieldEditor,
  "customProperty.choiceValue": ChoiceValueEditor,
  "taxonomy.taxonomy": TaxonomyEditor,
  "image.setMain": SetMainEditor,
  "taxonomyEntity.association": EntityAssociationEditor,
  "taxonomyEntity.field": EntityFieldEditor,
  "taxonomyEntity.socialPlatform": SocialPlatformEditor,
  "taxonomyDirect.association": DirectAssociationEditor,
  "taxonomyDirect.resolve": DirectResolveEditor,
  "taxonomyDirect.field": DirectFieldEditor,
  "taxonomyDirect.socialPlatform": SocialPlatformEditor,
  "sections.propertyId": SectionsPropertyEditor,
  "sections.entryType": SectionsEntryTypeEditor,
  "sections.layout": SectionsLayoutEditor,
};

/** Render the value editor for one override key (the file's only export, per the react-refresh rule). */
export function OverrideValueEditor({
  overrideKey, ...props
}: OverrideEditorProps & { overrideKey: OverrideKey }) {
  const Editor = OVERRIDE_EDITORS[overrideKey];
  return <Editor {...props} />;
}
