import type { LockedKeys } from "./fillTargetShared";
import type { ComboboxOption } from "../../Combobox";
import type { CustomProperty, FillTarget, SectionNamePart } from "@eesimple/types";

import { useId } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "../../Combobox";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { KindSelect, LabeledInput } from "../controls";
import { FillFilterList } from "../FillFilterList";
import { FillReadField } from "../FillReadField";
import { FillTransformList } from "../FillTransformList";
import { TextMatchEditor } from "../TextMatchEditor";

import { joinSelectorPath } from "@/lib/sectionSelectorPath";

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
 * A muted "full path" line shown under a relative selector field: the selector composed with its
 * ancestor chain (`prefix`), so it's clear what a "within each item" selector resolves to. Renders
 * nothing when there is no ancestor prefix or the field itself is empty (a field that is already its
 * own full path needs no hint).
 */
export function SelectorPathHint({
  prefix, selector,
}: {
  prefix: string;
  selector: string | undefined;
}) {
  const {
    t,
  } = useTranslation();
  const value = selector?.trim();
  if (!prefix || !value) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {t("Full path")}
      {": "}
      <span className="font-mono break-all">{joinSelectorPath(prefix, value)}</span>
    </p>
  );
}

/** "Resolve relative URLs" toggle for a section item link — turns a relative href into an absolute URL. */
function ResolveItemUrlToggle({
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
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={value => onChange(value === true)}
      />
      <Label htmlFor={id}>{t("Resolve relative URLs to absolute")}</Label>
    </div>
  );
}

/**
 * "Mark filled sections as exhaustive" toggle — flags the written value exhaustive (the scraped list
 * is the complete set), which enables sections-derived Progress.
 */
function MarkExhaustiveToggle({
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
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={value => onChange(value === true)}
        />
        <Label htmlFor={id}>{t("Mark filled sections as exhaustive")}</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("The scraped list is the complete set of sections. Enables a linked Progress property to auto-derive its count from the sections' completion.")}
      </p>
    </div>
  );
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
 *
 * The rule's top-level `extract.selector` (the "Item selector" that matches each repeated item) is
 * rendered inline here — between the section-level grouping selectors and the within-item name/link
 * selectors — so the selectors read largest → smallest, rather than in the generic rule fields below.
 */
export function SectionsTarget({
  target, propertiesById, onChange, lockedKeys, extractSelector = "", onExtractSelectorChange,
}: {
  target: SectionsTarget;
  propertiesById: Map<string, CustomProperty>;
  onChange: (target: FillTarget) => void;
  lockedKeys: LockedKeys;
  /** The rule's top-level `extract.selector` (matches each item) — used to compose the full-path hints. */
  extractSelector?: string;
  /**
   * Setter for the rule's top-level `extract.selector`. The item selector is rendered here (rather than
   * in the generic rule fields) so the selectors read largest → smallest: section wrapper → section
   * title → each repeated item → the item's own name/link.
   */
  onExtractSelectorChange: (selector: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const layoutLocked = lockedKeys.has("sections.layout");
  // The selector chain that resolves to each repeated item — the base for the "within each item" hints.
  const itemPath = joinSelectorPath(target.container, extractSelector);
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
          <>
            <p className="text-xs text-muted-foreground">
              {t("Selector should match the element whose text holds the timestamps (e.g. a video description). Each m:ss / h:mm:ss line becomes an entry.")}
            </p>
            <LabeledInput
              label={t("Selector")}
              placeholder={"[data-purpose=\"description\"]"}
              value={extractSelector}
              onChange={onExtractSelectorChange}
            />
          </>
        )
        : (
          <>
            <p className="text-xs text-muted-foreground">
              {t("The fields below go from the largest grouping to the smallest: how items are grouped into sections, the selector that matches each repeated item, then where each item's name and link come from.")}
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
                <SelectorPathHint
                  prefix={target.container ?? ""}
                  selector={target.header}
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
                  {t("Items come from the Item selector field below — it must match every row, including the section headers (e.g. the \"Part\" rows), so don't restrict it to links. Rows whose name matches here start a new top-level section; the rows after each nest as its children.")}
                </p>
              </div>
            )}

            <LabeledInput
              label={t("Item selector (matches each repeated item)")}
              placeholder={"[class*=\"course-lecture-title\"]"}
              value={extractSelector}
              onChange={onExtractSelectorChange}
              hint={t("Matches every repeated item (e.g. each course lecture). Tip: for classes that end in a rotating hash, match a stable substring with [class*=\"course-lecture-title\"].")}
            />
            <SelectorPathHint
              prefix={target.container ?? ""}
              selector={extractSelector}
            />
            <LabeledInput
              label={t("Item name selector (within each item)")}
              disabled={layoutLocked}
              placeholder={"[class*=\"course-lecture-title\"]"}
              value={target.itemName ?? ""}
              onChange={itemName => onChange({
                ...target,
                itemName,
              })}
              hint={t("Read within each item to get its name. Leave blank to use the item's own text, or use \"Name parts\" below to compose it from several elements.")}
            />
            <SelectorPathHint
              prefix={itemPath}
              selector={target.itemName}
            />
            <SectionNamePartsEditor
              parts={target.nameParts ?? []}
              separator={target.namePartSeparator}
              itemPath={itemPath}
              disabled={layoutLocked}
              onPartsChange={nameParts => onChange({
                ...target,
                nameParts,
              })}
              onSeparatorChange={namePartSeparator => onChange({
                ...target,
                namePartSeparator,
              })}
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
            <SelectorPathHint
              prefix={itemPath}
              selector={target.itemUrl}
            />
            {(target.itemUrl ?? "").trim()
              ? (
                <ResolveItemUrlToggle
                  checked={target.resolveItemUrl ?? false}
                  disabled={layoutLocked}
                  onChange={resolveItemUrl => onChange({
                    ...target,
                    resolveItemUrl,
                  })}
                />
              )
              : null}
            <p className="text-xs text-muted-foreground">
              {t("Tip: for classes that end in a rotating hash (e.g. Udemy's \"…__9JCrHq__section-title\"), match a stable substring with an attribute selector like [class*=\"section-title\"] instead of the full class.")}
            </p>
            <SectionsUdemyExample />
          </>
        )}
      <MarkExhaustiveToggle
        checked={target.exhaustive ?? false}
        disabled={layoutLocked}
        onChange={exhaustive => onChange({
          ...target,
          exhaustive,
        })}
      />
    </div>
  );
}

/** One composed-name part: a relative selector plus its own read / filters / transforms. */
function SectionNamePartRow({
  part, index, itemPath, disabled, onChange, onRemove,
}: {
  part: SectionNamePart;
  index: number;
  itemPath: string;
  disabled: boolean;
  onChange: (next: SectionNamePart) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("Part {{n}}", {
            n: index + 1,
          })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
        >
          {t("Remove")}
        </Button>
      </div>
      <LabeledInput
        label={t("Name part selector (within each item)")}
        disabled={disabled}
        placeholder={"[class*=\"badge\"]"}
        value={part.selector ?? ""}
        onChange={selector => onChange({
          ...part,
          selector,
        })}
        hint={t("Relative to the item. Leave blank to read the item element itself.")}
      />
      <SelectorPathHint
        prefix={itemPath}
        selector={part.selector}
      />
      <FillReadField
        read={part.read}
        onChange={read => onChange({
          ...part,
          read,
        })}
      />
      <FillFilterList
        filters={part.filters ?? []}
        onChange={filters => onChange({
          ...part,
          filters,
        })}
      />
      <FillTransformList
        transforms={part.transform ?? []}
        onChange={transform => onChange({
          ...part,
          transform,
        })}
      />
    </div>
  );
}

/**
 * Editor for composing a section item's name from **multiple** child elements. Each part targets a
 * relative selector (or the item itself), with its own read/filters/transforms; the non-empty parts
 * are joined by the separator. When empty, the single "Item name selector" above is used instead.
 */
function SectionNamePartsEditor({
  parts, separator, itemPath, disabled, onPartsChange, onSeparatorChange,
}: {
  parts: SectionNamePart[];
  separator: string | undefined;
  itemPath: string;
  disabled: boolean;
  onPartsChange: (parts: SectionNamePart[]) => void;
  onSeparatorChange: (separator: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border border-dashed p-2">
      <Label>{t("Name parts (compose from multiple elements)")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("Optional. When set, each item's name is built from these parts (joined by the separator) instead of the single \"Item name selector\" above — e.g. a badge span + a title span → \"quiz\" + \": \" + \"Why React?\".")}
      </p>
      {parts.map((part, index) => (
        <SectionNamePartRow
          key={index}
          part={part}
          index={index}
          itemPath={itemPath}
          disabled={disabled}
          onChange={next => onPartsChange(parts.map((existing, current) => (current === index ? next : existing)))}
          onRemove={() => onPartsChange(parts.filter((_, current) => current !== index))}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onPartsChange([...parts, {}])}
      >
        {t("Add name part")}
      </Button>
      {parts.length > 0 && (
        <LabeledInput
          label={t("Join parts with")}
          disabled={disabled}
          placeholder=": "
          value={separator ?? ""}
          onChange={onSeparatorChange}
          hint={t("Literal text inserted between parts (e.g. \": \"). Leave blank to concatenate directly.")}
        />
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
