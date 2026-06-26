import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
  SectionEntry,
  SectionEntryType,
} from "@eesimple/types";

import { useEffect } from "react";

import { SECTION_ENTRY_TYPES, SECTION_ENTRY_TYPE_LABELS, propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";
import { Loader2, Sparkles } from "lucide-react";

import { DATE_POSTED_SLUG, ISBN_SLUG, RUNTIME_SLUG } from "./bookmarkFormSchema";
import { BookmarkPropertyFileField } from "./BookmarkPropertyFileField";
import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";
import { useCategoryDefaults } from "../hooks/useCategories";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryCustomFieldsProps {
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
  /** `default` shows properties flagged to appear in the main form; `advanced` shows the rest. */
  placement: "default" | "advanced";
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
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: SectionEntry[]; }>;
  textInputs: Record<string, string>;
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

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
export function CategoryCustomFields({
  categoryId, mediaTypeId = null, properties, bookmark = null, placement, layout = "grid", className,
  hiddenSlugs = [RUNTIME_SLUG, DATE_POSTED_SLUG],
  numberInputs, booleanInputs, dateTimeInputs, choicesInputs, progressInputs, sectionsInputs, textInputs,
  onNumberChange, onBooleanChange, onDateTimeChange, onChoicesChange, onProgressChange, onSectionsChange, onTextChange,
  onIsbnFetch, isIsbnFetchPending,
}: CategoryCustomFieldsProps) {
  const categoryProps = properties.filter((property) => {
    // Union scoping: a property shows if it applies to the bookmark's category OR its media type.
    if (
      !propertyAppliesToCategory(property, categoryId)
      && !propertyAppliesToMediaType(property, mediaTypeId)
    ) return false;
    if (!property.enabled) return false;
    // hiddenFromForm drops the field entirely; otherwise showInForm chooses the main area vs. Advanced.
    if (property.hiddenFromForm) return false;
    // Slugs the form fills server-side (e.g. Runtime) are hidden but still persisted.
    if (hiddenSlugs?.includes(property.slug)) return false;
    return placement === "default" ? property.showInForm : !property.showInForm;
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
      <span className="text-sm font-medium">Properties</span>
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
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            dateTimeInputs={dateTimeInputs}
            choicesInputs={choicesInputs}
            progressInputs={progressInputs}
            sectionsInputs={sectionsInputs}
            textInputs={textInputs}
            onNumberChange={onNumberChange}
            onBooleanChange={onBooleanChange}
            onDateTimeChange={onDateTimeChange}
            onChoicesChange={onChoicesChange}
            onProgressChange={onProgressChange}
            onSectionsChange={onSectionsChange}
            onTextChange={onTextChange}
            onIsbnFetch={onIsbnFetch}
            isIsbnFetchPending={isIsbnFetchPending}
          />
        ))}
      </div>
    </div>
  );
}

/** The optional muted description line shown under most property fields. */
function FieldDescription({
  text,
}: {
  text: string | null | undefined;
}) {
  if (!text) return null;
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

interface CategoryPropertyFieldProps {
  property: CustomProperty;
  bookmark: Bookmark | null;
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: SectionEntry[]; }>;
  textInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
  onChoicesChange: (propertyId: string, values: string[]) => void;
  onProgressChange: (propertyId: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (propertyId: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  onTextChange: (propertyId: string, value: string) => void;
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
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

function NumberPropertyField({
  property, fieldId, value, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>
        {property.name}
        {property.unitPlural ? ` (${property.unitPlural})` : ""}
      </Label>
      <Input
        id={fieldId}
        type="number"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      <FieldDescription text={property.description} />
    </div>
  );
}

function BooleanPropertyField({
  property, fieldId, checked, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-1 self-end">
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={value => onChange(value === true)}
        />
        <Label htmlFor={fieldId}>{property.name}</Label>
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

function DateTimePropertyField({
  property, fieldId, value, onChange,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>{property.name}</Label>
      <DateTimePicker
        id={fieldId}
        format={property.dateTimeFormat ?? "date"}
        value={value}
        onChange={next => onChange(next ?? "")}
      />
      <FieldDescription text={property.description} />
    </div>
  );
}

function RatingScalePropertyField({
  property, raw, onChange,
}: {
  property: CustomProperty;
  raw: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{property.name}</Label>
      <div>
        <StarRating
          value={raw ? Number(raw) : 0}
          max={property.ratingMax ?? 5}
          allowHalf={property.ratingAllowHalf}
          allowZero={property.ratingAllowZero}
          onChange={value => onChange(String(value))}
        />
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

function ItemInItemsPropertyField({
  property, progress, onChange,
}: {
  property: CustomProperty;
  progress: { current: string;
    total: string; } | undefined;
  onChange: (field: "current" | "total", value: string) => void;
}) {
  const current = progress?.current ?? "";
  const total = progress?.total ?? "";
  const before = property.itemInItemsBeforeText ?? "";
  const between = property.itemInItemsBetweenText ?? " of ";
  const after = property.itemInItemsAfterText ?? "";
  return (
    <div className="col-span-full space-y-1">
      <Label>{property.name}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {before
          ? <span className="text-sm text-muted-foreground">{before}</span>
          : null}
        <Input
          type="number"
          className="w-24"
          placeholder="Current"
          value={current}
          onChange={event => onChange("current", event.target.value)}
        />
        <span className="text-sm text-muted-foreground">{between}</span>
        <Input
          type="number"
          className="w-24"
          placeholder="Total"
          value={total}
          onChange={event => onChange("total", event.target.value)}
        />
        {after
          ? <span className="text-sm text-muted-foreground">{after}</span>
          : null}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

function ChoicesPropertyField({
  property, selectedValues, onChange,
}: {
  property: CustomProperty;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const display = property.choicesDisplay ?? "radio";
  const multiple = property.choicesMultiple;
  const items = property.choicesItems;
  const fieldId = `property-${property.id}`;

  // Checkbox: multi-select list
  if (display === "checkbox") {
    return (
      <div className="col-span-full space-y-1">
        <Label>{property.name}</Label>
        <div className="space-y-1.5">
          {items.map(item => (
            <div
              key={item.value}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`${fieldId}-${item.value}`}
                checked={selectedValues.includes(item.value)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...selectedValues, item.value]
                      : selectedValues.filter(v => v !== item.value),
                  );
                }}
              />
              <Label
                htmlFor={`${fieldId}-${item.value}`}
                className="font-normal"
              >{item.label}
              </Label>
            </div>
          ))}
        </div>
        <FieldDescription text={property.description} />
      </div>
    );
  }

  // Radio: single-select with clear option
  if (display === "radio") {
    return (
      <div className="col-span-full space-y-1">
        <Label>{property.name}</Label>
        <div className="space-y-1.5">
          {items.map(item => (
            <div
              key={item.value}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                id={`${fieldId}-${item.value}`}
                name={fieldId}
                value={item.value}
                checked={selectedValues[0] === item.value}
                onChange={() => onChange([item.value])}
                className="size-4"
              />
              <Label
                htmlFor={`${fieldId}-${item.value}`}
                className="font-normal"
              >{item.label}
              </Label>
            </div>
          ))}
          {selectedValues.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`${fieldId}-none`}
                name={fieldId}
                checked={false}
                onChange={() => onChange([])}
                className="size-4"
              />
              <Label
                htmlFor={`${fieldId}-none`}
                className="font-normal text-muted-foreground"
              >Clear
              </Label>
            </div>
          )}
        </div>
        <FieldDescription text={property.description} />
      </div>
    );
  }

  // Dropdown / combobox: Select for single, checkbox list for multiple
  if (multiple) {
    return (
      <div className="col-span-full space-y-1">
        <Label>{property.name}</Label>
        <div className="space-y-1.5">
          {items.map(item => (
            <div
              key={item.value}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`${fieldId}-${item.value}`}
                checked={selectedValues.includes(item.value)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...selectedValues, item.value]
                      : selectedValues.filter(v => v !== item.value),
                  );
                }}
              />
              <Label
                htmlFor={`${fieldId}-${item.value}`}
                className="font-normal"
              >{item.label}
              </Label>
            </div>
          ))}
        </div>
        <FieldDescription text={property.description} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>{property.name}</Label>
      <Select
        value={selectedValues[0] ?? ""}
        onValueChange={value => onChange(value ? [value] : [])}
      >
        <SelectTrigger id={fieldId}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {items.map(item => (
            <SelectItem
              key={item.value}
              value={item.value}
            >{item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription text={property.description} />
    </div>
  );
}

function SectionsPropertyField({
  property, value, onChange,
}: {
  property: CustomProperty;
  value: { exhaustive: boolean;
    sections: SectionEntry[]; };
  onChange: (value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
}) {
  const allowedTypes = property.sectionsAllowedTypes ?? [...SECTION_ENTRY_TYPES];
  const defaultType: SectionEntryType = (property.sectionsDefaultType ?? allowedTypes[0] ?? "url") as SectionEntryType;

  function addSection(): void {
    onChange({
      ...value,
      sections: [
        ...value.sections,
        {
          id: crypto.randomUUID(),
          name: "",
          type: defaultType,
          startValue: "",
          endValue: undefined,
        },
      ],
    });
  }

  function updateEntry(id: string, patch: Partial<SectionEntry>): void {
    onChange({
      ...value,
      sections: value.sections.map(entry => entry.id === id
        ? {
          ...entry,
          ...patch,
        }
        : entry),
    });
  }

  function removeEntry(id: string): void {
    onChange({
      ...value,
      sections: value.sections.filter(entry => entry.id !== id),
    });
  }

  const fieldId = `property-${property.id}`;
  const startPlaceholder = (type: SectionEntryType) =>
    type === "page" ? "Start page" : type === "timestamp" ? "Start time" : "URL";
  const endPlaceholder = (type: SectionEntryType) =>
    type === "page" ? "End page" : type === "timestamp" ? "End time" : "End URL (optional)";

  return (
    <div className="col-span-full space-y-2">
      <Label>{property.name}</Label>
      {value.sections.length > 0 && (
        <div className="space-y-2">
          {value.sections.map(entry => (
            <div
              key={entry.id}
              className="grid items-start gap-2"
              style={{
                gridTemplateColumns: "1fr auto",
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={entry.name}
                  onChange={e => updateEntry(entry.id, {
                    name: e.target.value,
                  })}
                />
                {allowedTypes.length > 1
                  ? (
                    <Select
                      value={entry.type}
                      onValueChange={type => updateEntry(entry.id, {
                        type: type as SectionEntryType,
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedTypes.map(type => (
                          <SelectItem
                            key={type}
                            value={type}
                          >{SECTION_ENTRY_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                  : (
                    <span
                      className="
                        flex items-center text-sm text-muted-foreground
                      "
                    >
                      {SECTION_ENTRY_TYPE_LABELS[entry.type]}
                    </span>
                  )}
                <Input
                  placeholder={startPlaceholder(entry.type)}
                  value={entry.startValue}
                  type={entry.type === "page" ? "number" : "text"}
                  onChange={e => updateEntry(entry.id, {
                    startValue: e.target.value,
                  })}
                />
                <Input
                  placeholder={endPlaceholder(entry.type)}
                  value={entry.endValue ?? ""}
                  type={entry.type === "page" ? "number" : "text"}
                  onChange={e => updateEntry(entry.id, {
                    endValue: e.target.value || undefined,
                  })}
                />
              </div>
              <button
                type="button"
                className="
                  mt-1 text-lg leading-none text-muted-foreground
                  hover:text-destructive
                "
                aria-label="Remove section"
                onClick={() => removeEntry(entry.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="
            text-sm text-primary
            hover:underline
          "
          onClick={addSection}
        >
          + Add section
        </button>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${fieldId}-exhaustive`}
            checked={value.exhaustive}
            onCheckedChange={checked => onChange({
              ...value,
              exhaustive: checked === true,
            })}
          />
          <Label
            htmlFor={`${fieldId}-exhaustive`}
            className="text-sm font-normal"
          >
            Exhaustive
          </Label>
        </div>
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

function TextPropertyField({
  property, fieldId, value, onChange, onFetch, isFetchPending,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  onFetch?: (value: string) => void;
  isFetchPending?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>{property.name}</Label>
      <div className="flex gap-1">
        <Input
          id={fieldId}
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          onBlur={onFetch && value.trim() ? () => onFetch(value) : undefined}
        />
        {onFetch && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Fetch metadata from Open Library"
            aria-label="Fetch metadata from Open Library"
            disabled={!value.trim() || isFetchPending}
            onClick={() => onFetch(value)}
          >
            {isFetchPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Sparkles className="size-4" />}
          </Button>
        )}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

/**
 * An `image`/`file` property field. Blobs upload against an existing bookmark id, so on the create
 * form (no bookmark yet) it shows a "save first" hint instead of the upload control.
 */
function CategoryPropertyFileField({
  property, bookmark,
}: {
  property: CustomProperty;
  bookmark: Bookmark | null;
}) {
  if (!bookmark) {
    return (
      <div className="space-y-1">
        <Label>{property.name}</Label>
        <p className="text-xs text-muted-foreground">
          Save the bookmark first, then attach a
          {property.type === "image" ? "n image" : " file"}
          .
        </p>
      </div>
    );
  }
  return (
    <BookmarkPropertyFileField
      bookmarkId={bookmark.id}
      property={property}
      value={bookmark.fileValues.find(entry => entry.propertyId === property.id)}
    />
  );
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
