import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { LockedKeys } from "./fillTargetPicker/fillTargetShared";
import type { CustomProperty, FillTarget } from "@eesimple/types";

import { useId } from "react";

import { useTranslation } from "react-i18next";

import { KindSelect } from "./controls";
import { Combobox } from "../Combobox";
import { CustomPropertySubValue } from "./fillTargetPicker/CustomPropertyControls";
import { NO_LOCKS } from "./fillTargetPicker/fillTargetShared";
import { SectionsTarget } from "./fillTargetPicker/SectionsTargetControl";
import { TaxonomyDirectTarget, TaxonomyEntityTarget } from "./fillTargetPicker/TaxonomyTargetControls";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

import { coerceFillTarget } from "@/lib/extensionFillForm";

type FieldName = Extract<FillTarget, { kind: "field" }>["field"];
type TaxonomyName = Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];

/** The `kind` select plus the variant-specific value control for a rule's {@link FillTarget}. */
export function FillTargetPicker({
  target, propertyOptions, propertiesById, onChange, lockedKeys = NO_LOCKS, extractSelector = "",
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  /** Options a fill-rule group overrides — rendered read-only here. */
  lockedKeys?: LockedKeys;
  /** The rule's `extract.selector` — threaded to the sections control for its full-path hints. */
  extractSelector?: string;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <KindSelect
        label={t("Target")}
        disabled={lockedKeys.has("target.kind")}
        value={target.kind}
        options={[
          {
            value: "field",
            label: t("Bookmark field"),
            description: t("A core field on this bookmark: title, description, ISBN, or year."),
          },
          {
            value: "customProperty",
            label: t("Custom property"),
            description: t("A custom property you've defined for bookmarks."),
          },
          {
            value: "taxonomy",
            label: t("This bookmark's taxonomy (multi)"),
            description: t("This bookmark's own people, groups, locations, or tags."),
          },
          {
            value: "image",
            label: t("Image"),
            description: t("Grab an image off the page and upload it to this bookmark."),
          },
          {
            value: "taxonomyEntity",
            label: t("A linked term's field"),
            description: t("Write into a taxonomy term this bookmark is linked to (e.g. its Website or Person) — not the bookmark itself."),
          },
          {
            value: "taxonomyDirect",
            label: t("An entity from this page"),
            description: t("Update a taxonomy entity resolved from the page itself — no bookmark required."),
          },
          {
            value: "sections",
            label: t("Sections"),
            description: t("Build a Sections property (a course curriculum, chapters, or timestamps) from a repeated list on the page."),
          },
        ]}
        onValueChange={kind => onChange(coerceFillTarget(kind, target))}
      />
      <FillTargetValue
        target={target}
        propertyOptions={propertyOptions}
        propertiesById={propertiesById}
        onChange={onChange}
        lockedKeys={lockedKeys}
        extractSelector={extractSelector}
      />
    </div>
  );
}

/** The value control for the currently-selected target kind. */
function FillTargetValue({
  target, propertyOptions, propertiesById, onChange, lockedKeys, extractSelector,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
  extractSelector: string;
}) {
  const {
    t,
  } = useTranslation();
  switch (target.kind) {
    case "field":
      return (
        <KindSelect<FieldName>
          label={t("Field")}
          disabled={lockedKeys.has("field.field")}
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
            disabled={lockedKeys.has("customProperty.propertyId")}
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
            lockedKeys={lockedKeys}
          />
        </div>
      );
    case "taxonomy":
      return (
        <KindSelect<TaxonomyName>
          label={t("Taxonomy")}
          disabled={lockedKeys.has("taxonomy.taxonomy")}
          value={target.taxonomy}
          options={TAXONOMY_OPTIONS(t)}
          onValueChange={taxonomy => onChange({
            kind: "taxonomy",
            taxonomy,
          })}
        />
      );
    case "image":
      return (
        <SetMainImageToggle
          checked={target.setMain ?? false}
          disabled={lockedKeys.has("image.setMain")}
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
          lockedKeys={lockedKeys}
        />
      );
    case "taxonomyDirect":
      return (
        <TaxonomyDirectTarget
          target={target}
          onChange={onChange}
          lockedKeys={lockedKeys}
        />
      );
    case "sections":
      return (
        <SectionsTarget
          target={target}
          propertiesById={propertiesById}
          onChange={onChange}
          lockedKeys={lockedKeys}
          extractSelector={extractSelector}
        />
      );
  }
}

/** "Set as main image" toggle for an image target — grabs the image and makes it the primary one. */
function SetMainImageToggle({
  checked, onChange, disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
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
        disabled={disabled}
        onCheckedChange={value => onChange(value === true)}
      />
      <Label htmlFor={id}>{t("Set as main image")}</Label>
    </div>
  );
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
