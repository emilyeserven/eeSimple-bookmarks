import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { useEffect } from "react";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

import { DATE_POSTED_SLUG, RUNTIME_SLUG } from "./bookmarkFormSchema";
import { BookmarkPropertyFileField } from "./BookmarkPropertyFileField";
import { DateTimePicker } from "./DateTimePicker";
import { StarRating } from "./StarRating";
import { useCategoryDefaults } from "../hooks/useCategories";

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
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
  onChoicesChange: (propertyId: string, values: string[]) => void;
  onProgressChange: (propertyId: string, field: "current" | "total", value: string) => void;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
export function CategoryCustomFields({
  categoryId, mediaTypeId = null, properties, bookmark = null, placement, className,
  hiddenSlugs = [RUNTIME_SLUG, DATE_POSTED_SLUG],
  numberInputs, booleanInputs, dateTimeInputs, choicesInputs, progressInputs,
  onNumberChange, onBooleanChange, onDateTimeChange, onChoicesChange, onProgressChange,
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

  return (
    <div
      className={`
        space-y-3
        ${className ?? ""}
      `}
    >
      <span className="text-sm font-medium">Properties</span>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
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
            onNumberChange={onNumberChange}
            onBooleanChange={onBooleanChange}
            onDateTimeChange={onDateTimeChange}
            onChoicesChange={onChoicesChange}
            onProgressChange={onProgressChange}
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
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
  onChoicesChange: (propertyId: string, values: string[]) => void;
  onProgressChange: (propertyId: string, field: "current" | "total", value: string) => void;
}

/** Renders the single input appropriate to one custom property's type. */
function CategoryPropertyField({
  property, bookmark, numberInputs, booleanInputs, dateTimeInputs, choicesInputs, progressInputs,
  onNumberChange, onBooleanChange, onDateTimeChange, onChoicesChange, onProgressChange,
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
