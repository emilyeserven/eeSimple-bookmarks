import type { CustomPropertyInputs } from "./bookmarkFormSchema";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
  SectionEntry,
} from "@eesimple/types";

import { useEffect } from "react";

import { selectVisibleFormProperties } from "./bookmarkFormProperties";
import { DATE_POSTED_SLUG, ISBN_SLUG, RUNTIME_SLUG } from "./bookmarkFormSchema";
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
  onProgressChange: (propertyId: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (propertyId: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  onTextChange: (propertyId: string, value: string) => void;
  /** Called when the user clicks "Fetch metadata" on the ISBN field. */
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
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
   * When provided, only properties whose `propertyGroupId` matches this value are rendered.
   * Pass `null` to render only ungrouped properties (groupId === null or unknown group).
   * Omit to render all properties regardless of group.
   */
  groupId?: string | null;
  /** When true, the "Properties" section heading is omitted. */
  hideHeading?: boolean;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
export function CategoryCustomFields({
  categoryId, mediaTypeId = null, properties, bookmark = null, placement, layout = "grid", className,
  hiddenSlugs = [RUNTIME_SLUG, DATE_POSTED_SLUG],
  groupId, hideHeading = false,
  // The per-type input maps + change handlers travel together to each field — keep them bundled and
  // spread them, rather than threading ~18 individual props through the JSX (a complexity driver).
  ...inputBundle
}: CategoryCustomFieldsProps) {
  const categoryProps = selectVisibleFormProperties(properties, {
    categoryId,
    mediaTypeId,
    placement,
    hiddenSlugs,
    groupId,
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
      {!hideHeading && <span className="text-sm font-medium">Properties</span>}
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
            {...inputBundle}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryPropertyFieldProps extends CustomPropertyInputBundle {
  property: CustomProperty;
  bookmark: Bookmark | null;
}

/** Renders the single input appropriate to one custom property's type. */
function CategoryPropertyField({
  property, bookmark, numberInputs, booleanInputs, dateTimeInputs, choicesInputs, progressInputs,
  sectionsInputs, textInputs, onNumberChange, onBooleanChange, onDateTimeChange, onChoicesChange,
  onProgressChange, onSectionsChange, onTextChange, onIsbnFetch, isIsbnFetchPending,
}: CategoryPropertyFieldProps) {
  const fieldId = `property-${property.id}`;

  switch (property.type) {
    case "number":
      return (
        <NumberPropertyField
          property={property}
          fieldId={fieldId}
          value={numberInputs[property.id] ?? ""}
          onChange={value => onNumberChange(property.id, value)}
        />
      );
    case "boolean":
      return (
        <BooleanPropertyField
          property={property}
          fieldId={fieldId}
          checked={booleanInputs[property.id] ?? false}
          onChange={value => onBooleanChange(property.id, value)}
        />
      );
    case "datetime":
      return (
        <DateTimePropertyField
          property={property}
          fieldId={fieldId}
          value={dateTimeInputs[property.id] ?? null}
          onChange={value => onDateTimeChange(property.id, value)}
        />
      );
    case "ratingScale":
      return (
        <RatingScalePropertyField
          property={property}
          raw={numberInputs[property.id]}
          onChange={value => onNumberChange(property.id, value)}
        />
      );
    case "image":
    case "file":
      return (
        <CategoryPropertyFileField
          property={property}
          bookmark={bookmark}
        />
      );
    case "choices":
      return (
        <ChoicesPropertyField
          property={property}
          selectedValues={choicesInputs[property.id] ?? []}
          onChange={values => onChoicesChange(property.id, values)}
        />
      );
    case "itemInItems":
      return (
        <ItemInItemsPropertyField
          property={property}
          progress={progressInputs[property.id]}
          onChange={(field, value) => onProgressChange(property.id, field, value)}
        />
      );
    case "sections":
      return (
        <SectionsPropertyField
          property={property}
          value={sectionsInputs[property.id] ?? {
            exhaustive: false,
            sections: [],
          }}
          onChange={value => onSectionsChange(property.id, value)}
        />
      );
    case "text":
      return (
        <TextPropertyField
          property={property}
          fieldId={fieldId}
          value={textInputs[property.id] ?? ""}
          onChange={value => onTextChange(property.id, value)}
          onFetch={property.slug === ISBN_SLUG ? onIsbnFetch : undefined}
          isFetchPending={property.slug === ISBN_SLUG ? isIsbnFetchPending : undefined}
        />
      );
    default:
      // calculate: computed server-side; shown read-only so the user knows it exists.
      return (
        <div className="space-y-1">
          <Label>{property.name}</Label>
          <p className="text-xs text-muted-foreground">Calculated automatically when saved.</p>
        </div>
      );
  }
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
    // Re-apply only when the category or its loaded defaults change; `onApply` is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}
