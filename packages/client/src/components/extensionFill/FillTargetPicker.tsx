import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillTarget, OverrideKey, TaxonomyDirectFieldKey, TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec, TaxonomyEntityWriteKey } from "@eesimple/types";

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
import { TextMatchEditor } from "./TextMatchEditor";
import { Combobox } from "../Combobox";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

import { coerceFillTarget, directFieldSupported, taxonomyEntityFieldLabel, taxonomyEntityWriteKeys } from "@/lib/extensionFillForm";

type FieldName = Extract<FillTarget, { kind: "field" }>["field"];
type TaxonomyName = Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"];
type TaxonomyEntityTarget = Extract<FillTarget, { kind: "taxonomyEntity" }>;
type TaxonomyDirectTargetT = Extract<FillTarget, { kind: "taxonomyDirect" }>;
type ResolveMode = TaxonomyDirectTargetT["resolve"]["mode"];
type SubField = "current" | "total";

/** The two associations the server can resolve straight from the tab URL (domain / channelKey). */
const URL_RESOLVABLE_ASSOCIATIONS: TaxonomyEntityAssociation[] = ["website", "youtubeChannel"];

/** The set of options a fill-rule group has locked (read-only) on the rule being edited. */
type LockedKeys = Set<OverrideKey>;

const NO_LOCKS: LockedKeys = new Set();

/** The `kind` select plus the variant-specific value control for a rule's {@link FillTarget}. */
export function FillTargetPicker({
  target, propertyOptions, propertiesById, onChange, lockedKeys = NO_LOCKS,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  /** Options a fill-rule group overrides — rendered read-only here. */
  lockedKeys?: LockedKeys;
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
      />
    </div>
  );
}

/** The value control for the currently-selected target kind. */
function FillTargetValue({
  target, propertyOptions, propertiesById, onChange, lockedKeys,
}: {
  target: FillTarget;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
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
        />
      );
  }
}

type SectionsTarget = Extract<FillTarget, { kind: "sections" }>;
type SectionEntryTypeName = SectionsTarget["entryType"];
/** Which grouping strategy a sections target uses. Inferred from which optional fields are present. */
type SectionGroupingMode = "flat" | "container" | "text" | "headerSelector";

/** Derive the grouping mode from the target — precedence matches the engine (text > header > container). */
function sectionGroupingMode(target: SectionsTarget): SectionGroupingMode {
  if (target.sectionMatch != null) return "text";
  if (target.sectionHeaderSelector != null) return "headerSelector";
  if (target.container != null) return "container";
  return "flat";
}

/** Clear every grouping field, then set the chosen mode's holder (present-but-empty = mode is active). */
function applyGroupingMode(target: SectionsTarget, next: SectionGroupingMode): SectionsTarget {
  const cleared: SectionsTarget = {
    ...target,
    container: undefined,
    header: undefined,
    sectionMatch: undefined,
    sectionHeaderSelector: undefined,
  };
  if (next === "container") return {
    ...cleared,
    container: target.container ?? "",
  };
  if (next === "headerSelector") return {
    ...cleared,
    sectionHeaderSelector: target.sectionHeaderSelector ?? "",
  };
  if (next === "text") {
    return {
      ...cleared,
      sectionMatch: target.sectionMatch ?? {
        mode: "regex",
        value: "",
      },
    };
  }
  return cleared;
}

/**
 * Controls for a `sections` target: pick the sections-typed property, the entry type, and how the
 * page's items are grouped into sections/subsections. The grouping modes are mutually exclusive and
 * each shows only its own fields, so a rule can't silently combine two:
 * - **flat** — every row matched by the top-level Selector is its own section (no nesting);
 * - **container** — a repeated container element wraps each section and its items (`container`/`header`);
 * - **headerSelector** — headers and items sit in one flat list (no per-section wrapper);
 *   `sectionHeaderSelector` matches each header globally and items group under the header above them;
 * - **text** — one flat list, where a row whose name matches `sectionMatch` starts a new top-level
 *   section and the rows after it nest as children (the items come from the top-level Selector, which
 *   must match every row including the section headers).
 * For `timestamp` the grouping controls are hidden (the selector's text is parsed for `m:ss` lines).
 */
function SectionsTarget({
  target, propertiesById, onChange, lockedKeys,
}: {
  target: SectionsTarget;
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  const layoutLocked = lockedKeys.has("sections.layout");
  const sectionsOptions: ComboboxOption[] = [...propertiesById.values()]
    .filter(property => property.type === "sections")
    .map(property => ({
      value: property.id,
      label: property.name,
    }));
  const isTimestamp = target.entryType === "timestamp";
  const mode = sectionGroupingMode(target);
  // Switching mode clears the other modes' fields so the saved target stays single-mode; a present
  // (even empty) grouping field is what holds the chosen mode while the fields are edited.
  const changeMode = (next: SectionGroupingMode) => onChange(applyGroupingMode(target, next));
  return (
    <div className="space-y-2">
      <Combobox
        aria-label={t("Sections property")}
        disabled={lockedKeys.has("sections.propertyId")}
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
        disabled={lockedKeys.has("sections.entryType")}
        value={target.entryType}
        options={[
          {
            value: "name",
            label: t("Name only"),
            description: t("A plain titled list — just each item's name, no URL/page/timestamp (e.g. a course curriculum)."),
          },
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
            <p className="text-xs text-muted-foreground">
              {t("The \"Selector\" field (below the target) matches each repeated item; the fields here say how those items are grouped into sections and where each item's name comes from.")}
            </p>
            <KindSelect<SectionGroupingMode>
              label={t("Grouping")}
              disabled={layoutLocked}
              value={mode}
              options={[
                {
                  value: "flat",
                  label: t("None — each item is its own section"),
                  description: t("Every row matched by the Selector becomes a flat entry (no nesting)."),
                },
                {
                  value: "headerSelector",
                  label: t("By section header"),
                  description: t("Headers and items sit in one flat list (no per-section wrapper). A selector matches each section header; items group under the header above them (e.g. a Udemy curriculum)."),
                },
                {
                  value: "container",
                  label: t("By container element"),
                  description: t("A repeated container wraps each section and its items (e.g. one accordion per Part)."),
                },
                {
                  value: "text",
                  label: t("By item text"),
                  description: t("One flat list; a row whose name matches a pattern starts a new section and later rows nest under it."),
                },
              ]}
              onValueChange={changeMode}
            />

            {mode === "container" && (
              <>
                <LabeledInput
                  label={t("Section container selector")}
                  disabled={layoutLocked}
                  placeholder={"[data-purpose=\"course-section\"]"}
                  value={target.container ?? ""}
                  onChange={container => onChange({
                    ...target,
                    container,
                  })}
                  hint={t("Matches each repeated section wrapper (one per section), NOT the whole list. The \"Selector\" field then matches the items inside each of these.")}
                />
                <LabeledInput
                  label={t("Section name selector (within the container)")}
                  disabled={layoutLocked}
                  placeholder={"[class*=\"section-title\"]"}
                  value={target.header ?? ""}
                  onChange={header => onChange({
                    ...target,
                    header,
                  })}
                  hint={t("Read within each section container to get its title.")}
                />
              </>
            )}

            {mode === "headerSelector" && (
              <LabeledInput
                label={t("Section header selector")}
                disabled={layoutLocked}
                placeholder={"[class*=\"section-title\"]"}
                value={target.sectionHeaderSelector ?? ""}
                onChange={sectionHeaderSelector => onChange({
                  ...target,
                  sectionHeaderSelector,
                })}
                hint={t("A page-wide selector matching each section title. Items from the \"Selector\" field are grouped under the header that precedes them in the page.")}
              />
            )}

            {mode === "text" && (
              <div className="space-y-1">
                <Label>{t("Section header text match")}</Label>
                <TextMatchEditor
                  match={target.sectionMatch ?? {
                    mode: "regex",
                    value: "",
                  }}
                  onChange={sectionMatch => onChange({
                    ...target,
                    sectionMatch,
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t("Items come from the top-level Selector field above — it must match every row, including the section headers (e.g. the \"Part\" rows), so don't restrict it to links. Rows whose name matches here start a new top-level section; the rows after each nest as its children.")}
                </p>
              </div>
            )}

            <LabeledInput
              label={t("Item name selector (within each item)")}
              disabled={layoutLocked}
              placeholder={"[class*=\"course-lecture-title\"]"}
              value={target.itemName ?? ""}
              onChange={itemName => onChange({
                ...target,
                itemName,
              })}
              hint={t("Read within each item to get its name. Leave blank to use the item's own text.")}
            />
            <LabeledInput
              label={t("Item link selector (within each item)")}
              disabled={layoutLocked}
              placeholder="a"
              value={target.itemUrl ?? ""}
              onChange={itemUrl => onChange({
                ...target,
                itemUrl,
              })}
              hint={t("Optional. Read a per-item link's href. Leave blank for \"Name only\", or to read the value off the item itself via Read/Transform.")}
            />
            <p className="text-xs text-muted-foreground">
              {t("Tip: for classes that end in a rotating hash (e.g. Udemy's \"…__9JCrHq__section-title\"), match a stable substring with an attribute selector like [class*=\"section-title\"] instead of the full class.")}
            </p>
            <SectionsUdemyExample />
          </>
        )}
    </div>
  );
}

/** A collapsible worked example: configuring a Udemy course curriculum as a name-only, grouped list. */
function SectionsUdemyExample() {
  const {
    t,
  } = useTranslation();
  const rows: [string, string][] = [
    [t("Entry type"), t("Name only")],
    [t("Grouping"), t("By section header")],
    [t("Section header selector"), "[class*=\"section-title\"]"],
    [t("Selector (each item)"), "[class*=\"course-lecture-title\"]"],
  ];
  return (
    <details className="rounded-md border bg-muted/30 p-2 text-xs">
      <summary className="cursor-pointer text-muted-foreground">
        {t("Example: a Udemy course curriculum (sections → lectures)")}
      </summary>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[10rem_1fr] gap-2"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono break-all">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-muted-foreground">
        {t("Exact classes vary — match a stable substring. This produces one section per curriculum part, each nesting its lecture names, with no URL/page/timestamp.")}
      </p>
    </details>
  );
}

/**
 * Controls for an "Associated taxonomy" target: pick the linked taxonomy, then one of its writable
 * fields, then (for a social link) the platform. Switching the taxonomy resets the field when the
 * previous one doesn't apply to the new entity.
 */
function TaxonomyEntityTarget({
  target, onChange, lockedKeys,
}: {
  target: TaxonomyEntityTarget;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  // Scalar fields + relations (`relation:<key>`) + `language` — whichever the association supports.
  const writeKeys = taxonomyEntityWriteKeys(target.association);
  return (
    <div className="space-y-2">
      <KindSelect<TaxonomyEntityAssociation>
        label={t("Taxonomy")}
        disabled={lockedKeys.has("taxonomyEntity.association")}
        value={target.association}
        options={TAXONOMY_ENTITY_ASSOCIATIONS.map(association => ({
          value: association,
          label: t(TAXONOMY_ENTITY_SPECS[association].label),
        }))}
        onValueChange={(association) => {
          // Keep the current field if the new entity supports it, else fall back to its first field.
          const nextKeys = taxonomyEntityWriteKeys(association);
          const field = nextKeys.includes(target.field) ? target.field : nextKeys[0];
          onChange({
            kind: "taxonomyEntity",
            association,
            field,
          });
        }}
      />
      <KindSelect<TaxonomyEntityWriteKey>
        label={t("Field")}
        disabled={lockedKeys.has("taxonomyEntity.field")}
        value={target.field}
        options={writeKeys.map(field => ({
          value: field,
          label: t(taxonomyEntityFieldLabel(field)),
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
            disabled={lockedKeys.has("taxonomyEntity.socialPlatform")}
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

/** Build a `taxonomyDirect` target from parts, clamping `field` to one the association supports. */
function buildDirectTarget(
  association: TaxonomyEntityAssociation,
  resolve: TaxonomyDirectTargetT["resolve"],
  field: TaxonomyDirectFieldKey,
  socialPlatform?: TaxonomyDirectTargetT["socialPlatform"],
): TaxonomyDirectTargetT {
  const nextField = directFieldSupported(association, field)
    ? field
    : TAXONOMY_ENTITY_SPECS[association].fields[0];
  return {
    kind: "taxonomyDirect",
    association,
    resolve,
    field: nextField,
    ...(nextField === "socialLink" && socialPlatform
      ? {
        socialPlatform,
      }
      : {}),
  };
}

/** The fillable fields for an association: its writable JSON fields plus `image` when supported. */
function directFieldKeys(association: TaxonomyEntityAssociation): TaxonomyDirectFieldKey[] {
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  return spec.image ? [...spec.fields, "image"] : [...spec.fields];
}

/**
 * Controls for a "Taxonomy entity (direct)" target: how the entity is resolved from the page (its tab
 * URL, or a scraped identifier), which taxonomy + field to write, and the platform for a social link.
 * Switching the resolve mode narrows the association list (URL mode only resolves website/YouTube
 * channel); switching the association re-clamps the field.
 */
function TaxonomyDirectTarget({
  target, onChange, lockedKeys,
}: {
  target: TaxonomyDirectTargetT;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  const resolveLocked = lockedKeys.has("taxonomyDirect.resolve");
  const associations = target.resolve.mode === "url"
    ? URL_RESOLVABLE_ASSOCIATIONS
    : TAXONOMY_ENTITY_ASSOCIATIONS;
  const fields = directFieldKeys(target.association);
  return (
    <div className="space-y-2">
      <KindSelect<ResolveMode>
        label={t("Resolve entity by")}
        disabled={resolveLocked}
        value={target.resolve.mode}
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
        onValueChange={(mode) => {
          // URL mode only resolves website/YouTube channel — fall back to website when switching.
          const association = mode === "url" && !URL_RESOLVABLE_ASSOCIATIONS.includes(target.association)
            ? "website"
            : target.association;
          const resolve: TaxonomyDirectTargetT["resolve"] = mode === "url"
            ? {
              mode: "url",
            }
            : {
              mode: "match",
              select: target.resolve.mode === "match"
                ? target.resolve.select
                : {
                  selector: "",
                },
            };
          onChange(buildDirectTarget(association, resolve, target.field, target.socialPlatform));
        }}
      />
      {target.resolve.mode === "match"
        ? (
          <LabeledInput
            label={t("Entity name selector")}
            disabled={resolveLocked}
            placeholder="h1.entry-title"
            value={target.resolve.select.selector ?? ""}
            onChange={selector => onChange(buildDirectTarget(
              target.association,
              {
                mode: "match",
                select: {
                  ...target.resolve.mode === "match" ? target.resolve.select : {},
                  selector,
                },
              },
              target.field,
              target.socialPlatform,
            ))}
          />
        )
        : null}
      <KindSelect<TaxonomyEntityAssociation>
        label={t("Taxonomy")}
        disabled={lockedKeys.has("taxonomyDirect.association")}
        value={target.association}
        options={associations.map(association => ({
          value: association,
          label: t(TAXONOMY_ENTITY_SPECS[association].label),
        }))}
        onValueChange={association =>
          onChange(buildDirectTarget(association, target.resolve, target.field, target.socialPlatform))}
      />
      <KindSelect<TaxonomyDirectFieldKey>
        label={t("Field")}
        disabled={lockedKeys.has("taxonomyDirect.field")}
        value={target.field}
        options={fields.map(field => ({
          value: field,
          label: t(TAXONOMY_ENTITY_FIELD_LABELS[field]),
        }))}
        onValueChange={field =>
          onChange(buildDirectTarget(target.association, target.resolve, field, target.socialPlatform))}
      />
      {target.field === "socialLink"
        ? (
          <Combobox
            aria-label={t("Platform")}
            disabled={lockedKeys.has("taxonomyDirect.socialPlatform")}
            options={SOCIAL_MEDIA_PLATFORMS.map(platform => ({
              value: platform,
              label: SOCIAL_MEDIA_PLATFORM_LABELS[platform],
            }))}
            value={target.socialPlatform || undefined}
            placeholder={t("Select a platform")}
            emptyText={t("No platforms found.")}
            onValueChange={value => onChange(buildDirectTarget(
              target.association,
              target.resolve,
              "socialLink",
              (value as TaxonomyDirectTargetT["socialPlatform"]) || undefined,
            ))}
          />
        )
        : null}
    </div>
  );
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

/**
 * For a multi-value property, a sub-value selector: Two-Numbers (`itemInItems`) → Current/Total;
 * Choices → which option. Other property types (and while none is selected) render nothing.
 */
function CustomPropertySubValue({
  target, property, onChange, lockedKeys,
}: {
  target: Extract<FillTarget, { kind: "customProperty" }>;
  property: CustomProperty | undefined;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
}) {
  const {
    t,
  } = useTranslation();
  if (property?.type === "itemInItems") {
    return (
      <KindSelect<SubField>
        label={t("Value")}
        disabled={lockedKeys.has("customProperty.subField")}
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
        disabled={lockedKeys.has("customProperty.choiceValue")}
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
