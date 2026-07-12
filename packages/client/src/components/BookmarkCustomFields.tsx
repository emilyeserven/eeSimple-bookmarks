import type { CustomPropertyInputs, ProgressInputEntry } from "./bookmarkFormSchema";
import type {
  BookmarkAddFormPlacement,
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
  CustomPropertyType,
  SectionEntry,
} from "@eesimple/types";
import type { ReactElement } from "react";

import { useEffect } from "react";

import { useTranslation } from "react-i18next";

import { selectVisibleFormProperties } from "./bookmarkFormProperties";
import { DATE_POSTED_SLUG, deriveItemInItemsDisplay, ISBN_SLUG, RUNTIME_SLUG, SECTIONS_SLUG } from "./bookmarkFormSchema";
import {
  BooleanPropertyField,
  CategoryPropertyFileField,
  ChoicesPropertyField,
  DateTimePropertyField,
  ItemInItemsPropertyField,
  NumberPropertyField,
  RatingScalePropertyField,
  SectionsPropertyField,
  TextPropertyField,
} from "./BookmarkPropertyFields";
import { useCategoryDefaults } from "../hooks/useCategories";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { sectionEntryTypeHint } from "../lib/sectionEntryTypeHint";

import { Label } from "@/components/ui/label";

/**
 * The per-property-type value maps plus their change handlers, threaded identically through the
 * category-level field list ({@link CategoryCustomFields}) and the single-property renderer
 * ({@link CategoryPropertyField}). Both prop interfaces extend this so the bundle is declared once.
 */
interface CustomPropertyInputBundle extends CustomPropertyInputs {
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
  onChoicesChange: (propertyId: string, values: string[]) => void;
  onProgressChange: (propertyId: string, field: keyof ProgressInputEntry, value: string) => void;
  onSectionsChange: (propertyId: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  onTextChange: (propertyId: string, value: string) => void;
  /** Called when the user clicks "Fetch metadata" on the ISBN field. */
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
  /** Called when the user clicks "Import from Kavita" on the Page Sections field. */
  onSectionsImport?: (propertyId: string) => void;
  isSectionsImportPending?: boolean;
  /** Match-or-create author names parsed from a pasted list into the bookmark's People. */
  onAddPeople?: (names: string[]) => void;
}

interface CategoryCustomFieldsProps extends CustomPropertyInputBundle {
  categoryId: string;
  /** The bookmark's selected media type, if any; properties scoped to it also appear (union). */
  mediaTypeId?: string | null;
  properties: CustomProperty[];
  /**
   * The bookmark being edited, when one already exists. Required to render `image`/`file` property
   * fields (their blobs upload against an existing id); on the create form it's omitted and those
   * fields show a "save first" hint instead.
   */
  bookmark?: Bookmark | null;
  /**
   * `default` shows properties flagged to appear in the main form; `advanced` shows the rest;
   * `details` shows properties with `showInDetails`; `all` shows all non-hidden properties.
   */
  placement: "default" | "advanced" | "details" | "all";
  /**
   * Field arrangement. `grid` (default) packs fields into a compact 2-column grid for the
   * Add Bookmark create drawer; `stack` lays them out one-per-row with roomy spacing for the
   * dedicated full-width edit page.
   */
  layout?: "grid" | "stack";
  /** Extra classes for the root (e.g. a grid `col-span` when rendered in the main form). */
  className?: string;
  /**
   * Property slugs to drop from rendering entirely (their value is still submitted/derived).
   * Defaults to the form's server-filled slugs (e.g. Runtime).
   */
  hiddenSlugs?: string[];
  /**
   * Per-slug placement overrides from the Add Bookmark Form settings (create mode only). Passed
   * through to {@link selectVisibleFormProperties}; omitted on the edit/detail surfaces.
   */
  placementOverrides?: Record<string, BookmarkAddFormPlacement>;
  /**
   * Ids of custom properties an automation filled this session; with {@link revealAutofilledInMain}
   * on, they are lifted into the main (`default`) zone. Create-mode only; omitted on edit/detail.
   */
  autofilledPropertyIds?: ReadonlySet<string>;
  /** Whether the "reveal auto-filled fields in main" setting is on (create-mode only). */
  revealAutofilledInMain?: boolean;
  /** When true, the "Properties" section heading is omitted. */
  hideHeading?: boolean;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
export function CategoryCustomFields({
  categoryId, mediaTypeId = null, properties, bookmark = null, placement, layout = "grid", className,
  hiddenSlugs = [RUNTIME_SLUG, DATE_POSTED_SLUG],
  placementOverrides,
  autofilledPropertyIds,
  revealAutofilledInMain,
  hideHeading = false,
  // The per-type input maps + change handlers travel together to each field — keep them bundled and
  // spread them, rather than threading ~18 individual props through the JSX (a complexity driver).
  ...inputBundle
}: CategoryCustomFieldsProps) {
  const {
    t,
  } = useTranslation();
  const categoryProps = selectVisibleFormProperties(properties, {
    categoryId,
    mediaTypeId,
    placement,
    hiddenSlugs,
    placementOverrides,
    autofilledPropertyIds,
    revealAutofilledInMain,
  });
  if (categoryProps.length === 0) return null;

  const stacked = layout === "stack";
  return (
    <div
      className={`
        ${stacked ? "space-y-4" : "space-y-3"}
        ${className ?? ""}
      `}
    >
      {!hideHeading && <span className="text-sm font-medium">{t("Properties")}</span>}
      <div
        className={stacked
          ? "flex flex-col gap-5"
          : `
            grid gap-3
            sm:grid-cols-2
          `}
      >
        {categoryProps.map(property => (
          <CategoryPropertyField
            key={property.id}
            property={property}
            bookmark={bookmark}
            mediaTypeId={mediaTypeId}
            {...inputBundle}
          />
        ))}
      </div>
    </div>
  );
}

export interface CategoryPropertyFieldProps extends CustomPropertyInputBundle {
  property: CustomProperty;
  bookmark: Bookmark | null;
  /**
   * The form's selected media type (create form). Edit surfaces omit it and the fields that care
   * fall back to `bookmark.mediaTypeId`. Drives the itemInItems per-media-type text overrides and
   * the sections default-entry-type hint.
   */
  mediaTypeId?: string | null;
}

function NumberField({
  property, numberInputs, onNumberChange,
}: CategoryPropertyFieldProps) {
  return (
    <NumberPropertyField
      property={property}
      fieldId={`property-${property.id}`}
      value={numberInputs[property.id] ?? ""}
      onChange={value => onNumberChange(property.id, value)}
    />
  );
}

function BooleanField({
  property, booleanInputs, onBooleanChange,
}: CategoryPropertyFieldProps) {
  return (
    <BooleanPropertyField
      property={property}
      fieldId={`property-${property.id}`}
      checked={booleanInputs[property.id] ?? false}
      onChange={value => onBooleanChange(property.id, value)}
    />
  );
}

function DateTimeField({
  property, dateTimeInputs, onDateTimeChange,
}: CategoryPropertyFieldProps) {
  return (
    <DateTimePropertyField
      property={property}
      fieldId={`property-${property.id}`}
      value={dateTimeInputs[property.id] ?? null}
      onChange={value => onDateTimeChange(property.id, value)}
    />
  );
}

function RatingScaleField({
  property, numberInputs, onNumberChange,
}: CategoryPropertyFieldProps) {
  return (
    <RatingScalePropertyField
      property={property}
      raw={numberInputs[property.id]}
      onChange={value => onNumberChange(property.id, value)}
    />
  );
}

function FileField({
  property, bookmark,
}: CategoryPropertyFieldProps) {
  return (
    <CategoryPropertyFileField
      property={property}
      bookmark={bookmark}
    />
  );
}

function ChoicesField({
  property, choicesInputs, onChoicesChange,
}: CategoryPropertyFieldProps) {
  return (
    <ChoicesPropertyField
      property={property}
      selectedValues={choicesInputs[property.id] ?? []}
      onChange={values => onChoicesChange(property.id, values)}
    />
  );
}

function ItemInItemsField({
  property, bookmark, mediaTypeId, progressInputs, sectionsInputs, onProgressChange,
}: CategoryPropertyFieldProps) {
  // Read-only + live-computed from the linked Sections when that value is exhaustive; otherwise the
  // user's own manual counts (see deriveItemInItemsDisplay).
  const {
    derived, progress,
  } = deriveItemInItemsDisplay(property, sectionsInputs, progressInputs[property.id]);
  return (
    <ItemInItemsPropertyField
      property={property}
      progress={progress}
      mediaTypeId={mediaTypeId ?? bookmark?.mediaType?.id ?? null}
      derived={derived}
      onChange={(field, value) => onProgressChange(property.id, field, value)}
    />
  );
}

function SectionsField({
  property, bookmark, mediaTypeId, sectionsInputs, onSectionsChange, onSectionsImport, isSectionsImportPending, onAddPeople,
}: CategoryPropertyFieldProps) {
  const {
    data: mediaTypes,
  } = useMediaTypes();
  return (
    <SectionsPropertyField
      property={property}
      value={sectionsInputs[property.id] ?? {
        exhaustive: false,
        sections: [],
      }}
      onChange={value => onSectionsChange(property.id, value)}
      onImport={property.slug === SECTIONS_SLUG && onSectionsImport
        ? () => onSectionsImport(property.id)
        : undefined}
      isImportPending={property.slug === SECTIONS_SLUG ? isSectionsImportPending : undefined}
      onAddPeople={onAddPeople}
      defaultTypeHint={sectionEntryTypeHint(mediaTypeId ?? bookmark?.mediaType?.id, mediaTypes ?? [])}
    />
  );
}

function TextField({
  property, textInputs, onTextChange, onIsbnFetch, isIsbnFetchPending,
}: CategoryPropertyFieldProps) {
  return (
    <TextPropertyField
      property={property}
      fieldId={`property-${property.id}`}
      value={textInputs[property.id] ?? ""}
      onChange={value => onTextChange(property.id, value)}
      onFetch={property.slug === ISBN_SLUG ? onIsbnFetch : undefined}
      isFetchPending={property.slug === ISBN_SLUG ? isIsbnFetchPending : undefined}
    />
  );
}

/** calculate: computed server-side; shown read-only so the user knows it exists. */
function CalculatedField({
  property,
}: CategoryPropertyFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{property.name}</Label>
      <p className="text-xs text-muted-foreground">{t("Calculated automatically when saved.")}</p>
    </div>
  );
}

/**
 * Per-type field renderer, exhaustive over {@link CustomPropertyType} so a new property type
 * missing an input fails `tsc` instead of silently rendering nothing (the `PropertyDetail`
 * `OPTIONS_FIELDS` technique).
 */
const PROPERTY_FIELD_RENDERERS: Record<
  CustomPropertyType,
  (props: CategoryPropertyFieldProps) => ReactElement
> = {
  number: NumberField,
  boolean: BooleanField,
  calculate: CalculatedField,
  datetime: DateTimeField,
  ratingScale: RatingScaleField,
  image: FileField,
  file: FileField,
  choices: ChoicesField,
  itemInItems: ItemInItemsField,
  sections: SectionsField,
  text: TextField,
};

/** Renders the single input appropriate to one custom property's type. */
export function CategoryPropertyField(props: CategoryPropertyFieldProps) {
  const Renderer = PROPERTY_FIELD_RENDERERS[props.property.type];
  return <Renderer {...props} />;
}

interface CategoryDefaultsApplierProps {
  categoryId: string;
  onApply: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
}

/**
 * Headless helper that loads the chosen category's default property values and applies them to the
 * form whenever the category changes. Renders nothing — the parent owns the property inputs.
 */
export function CategoryDefaultsApplier({
  categoryId, onApply,
}: CategoryDefaultsApplierProps) {
  const {
    data: defaults,
  } = useCategoryDefaults(categoryId);

  useEffect(() => {
    if (!categoryId || !defaults) return;
    onApply(defaults.numberValues, defaults.booleanValues, defaults.dateTimeValues);
    // `onApply` (`applyCategoryDefaults`) is recreated each render but is idempotent and internally
    // skips user-touched/rule-set fields; re-applying should track only `categoryId`/`defaults`, so
    // `onApply` is deliberately omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}
