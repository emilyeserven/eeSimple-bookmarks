import type {
  Bookmark,
  CustomProperty,
  SectionEntry,
  SectionEntryType,
} from "@eesimple/types";

import { resolveItemInItemsTexts, SECTION_ENTRY_TYPES, SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkPropertyFileField } from "./BookmarkPropertyFileField";
import { ChoicesCheckboxList } from "./ChoicesCheckboxList";
import { DateTimePicker } from "./DateTimePicker";
import { SectionPasteParser } from "./SectionPasteParser";
import { StarRating } from "./StarRating";

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
import { randomId } from "@/lib/utils";

/** The optional muted description line shown under most property fields. */
export function FieldDescription({
  text,
}: {
  text: string | null | undefined;
}) {
  if (!text) return null;
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

export function NumberPropertyField({
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

export function BooleanPropertyField({
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

export function DateTimePropertyField({
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

export function RatingScalePropertyField({
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

export function ItemInItemsPropertyField({
  property, progress, onChange, mediaTypeId = null, derived = false,
}: {
  property: CustomProperty;
  progress: { current: string;
    total: string; } | undefined;
  onChange: (field: "current" | "total", value: string) => void;
  /** The bookmark's media type, used to resolve the per-media-type text overrides. */
  mediaTypeId?: string | null;
  /**
   * When true, this value is derived from the linked sections property's completion — the inputs
   * render disabled with an explanatory hint (the server recomputes on every save).
   */
  derived?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const current = progress?.current ?? "";
  const total = progress?.total ?? "";
  const texts = resolveItemInItemsTexts(property, mediaTypeId);
  const before = texts.before ?? "";
  const between = texts.between ?? t(" of ");
  const after = texts.after ?? "";
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
          placeholder={t("Current")}
          value={current}
          disabled={derived}
          onChange={event => onChange("current", event.target.value)}
        />
        <span className="text-sm text-muted-foreground">{between}</span>
        <Input
          type="number"
          className="w-24"
          placeholder={t("Total")}
          value={total}
          disabled={derived}
          onChange={event => onChange("total", event.target.value)}
        />
        {after
          ? <span className="text-sm text-muted-foreground">{after}</span>
          : null}
      </div>
      {derived
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Derived automatically from the completed Sections items.")}
          </p>
        )
        : null}
      <FieldDescription text={property.description} />
    </div>
  );
}

export function ChoicesPropertyField({
  property, selectedValues, onChange,
}: {
  property: CustomProperty;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  const display = property.choicesDisplay ?? "radio";
  const multiple = property.choicesMultiple;
  const items = property.choicesItems;
  const fieldId = `property-${property.id}`;

  // Checkbox: multi-select list
  if (display === "checkbox") {
    return (
      <ChoicesCheckboxList
        property={property}
        fieldId={fieldId}
        selectedValues={selectedValues}
        onChange={onChange}
      />
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
              >{t("Clear")}
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
      <ChoicesCheckboxList
        property={property}
        fieldId={fieldId}
        selectedValues={selectedValues}
        onChange={onChange}
      />
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
          <SelectValue placeholder={t("Select…")} />
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

/** A blank section entry (or child) with a stable id. */
function newSectionEntry(defaultType: SectionEntryType): SectionEntry {
  return {
    id: randomId(),
    name: "",
    type: defaultType,
    startValue: "",
    endValue: undefined,
  };
}

/** The shared Name / Type / Start / End input grid for a section entry or child. */
function SectionEntryInputs({
  entry, allowedTypes, onPatch,
}: {
  entry: SectionEntry;
  allowedTypes: SectionEntryType[];
  onPatch: (patch: Partial<SectionEntry>) => void;
}) {
  const {
    t,
  } = useTranslation();
  const numeric = entry.type === "page";
  // A `name`-only entry carries no positional value — hide the Start/End inputs (Name, Type, and the
  // optional Link URL stay).
  const nameOnly = entry.type === "name";
  const startPlaceholder = entry.type === "page" ? t("Start page") : entry.type === "timestamp" ? t("Start time") : t("URL");
  const endPlaceholder = entry.type === "page" ? t("End page") : entry.type === "timestamp" ? t("End time") : t("End URL (optional)");
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        placeholder={t("Name")}
        value={entry.name}
        onChange={e => onPatch({
          name: e.target.value,
        })}
      />
      {allowedTypes.length > 1
        ? (
          <Select
            value={entry.type}
            onValueChange={type => onPatch({
              type: type as SectionEntryType,
              // Switching to a name-only entry drops any positional value so nothing stale persists.
              ...(type === "name"
                ? {
                  startValue: "",
                  endValue: undefined,
                }
                : {}),
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
                >{t(SECTION_ENTRY_TYPE_LABELS[type])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        : (
          <span
            className="flex items-center text-sm text-muted-foreground"
          >
            {t(SECTION_ENTRY_TYPE_LABELS[entry.type])}
          </span>
        )}
      {!nameOnly && (
        <>
          <Input
            placeholder={startPlaceholder}
            value={entry.startValue}
            type={numeric ? "number" : "text"}
            onChange={e => onPatch({
              startValue: e.target.value,
            })}
          />
          <Input
            placeholder={endPlaceholder}
            value={entry.endValue ?? ""}
            type={numeric ? "number" : "text"}
            onChange={e => onPatch({
              endValue: e.target.value || undefined,
            })}
          />
        </>
      )}
      <Input
        className="col-span-2"
        placeholder={t("Link URL (optional)")}
        type="url"
        value={entry.url ?? ""}
        onChange={e => onPatch({
          url: e.target.value || undefined,
        })}
      />
    </div>
  );
}

/** The "×" remove control shared by section rows and child rows. */
function RemoveEntryButton({
  label, onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="
        mt-1 text-lg leading-none text-muted-foreground
        hover:text-destructive
      "
      aria-label={label}
      onClick={onClick}
    >
      ×
    </button>
  );
}

/** The per-entry "done" checkbox shown at the left edge of a section/sub-item row. */
function CompletedCheckbox({
  entry, onToggle,
}: {
  entry: SectionEntry;
  onToggle: (completed: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Checkbox
      className="mt-2.5"
      checked={entry.completed === true}
      aria-label={t("Completed")}
      title={t("Completed")}
      onCheckedChange={checked => onToggle(checked === true)}
    />
  );
}

/** One tier-1 section entry, with an indented child editor for its second-tier items. */
function SectionRow({
  entry, allowedTypes, defaultType, onChange, onRemove,
}: {
  entry: SectionEntry;
  allowedTypes: SectionEntryType[];
  defaultType: SectionEntryType;
  onChange: (entry: SectionEntry) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const children = entry.children ?? [];
  return (
    <div className="space-y-2">
      <div
        className="grid items-start gap-2"
        style={{
          gridTemplateColumns: "auto 1fr auto",
        }}
      >
        <CompletedCheckbox
          entry={entry}
          // Checking a section also checks all its sub-items (write-time cascade; unchecking too).
          onToggle={completed => onChange({
            ...entry,
            completed,
            ...(entry.children && {
              children: entry.children.map(c => ({
                ...c,
                completed,
              })),
            }),
          })}
        />
        <SectionEntryInputs
          entry={entry}
          allowedTypes={allowedTypes}
          onPatch={patch => onChange({
            ...entry,
            ...patch,
          })}
        />
        <RemoveEntryButton
          label={t("Remove section")}
          onClick={onRemove}
        />
      </div>
      <div
        className="ml-4 space-y-2 border-l pl-3"
      >
        {children.map(child => (
          <div
            key={child.id}
            className="grid items-start gap-2"
            style={{
              gridTemplateColumns: "auto 1fr auto",
            }}
          >
            <CompletedCheckbox
              entry={child}
              onToggle={completed => onChange({
                ...entry,
                children: children.map(c => c.id === child.id
                  ? {
                    ...c,
                    completed,
                  }
                  : c),
              })}
            />
            <SectionEntryInputs
              entry={child}
              allowedTypes={allowedTypes}
              onPatch={patch => onChange({
                ...entry,
                children: children.map(c => c.id === child.id
                  ? {
                    ...c,
                    ...patch,
                  }
                  : c),
              })}
            />
            <RemoveEntryButton
              label={t("Remove item")}
              onClick={() => onChange({
                ...entry,
                children: children.filter(c => c.id !== child.id),
              })}
            />
          </div>
        ))}
        <button
          type="button"
          className="
            text-xs text-primary
            hover:underline
          "
          onClick={() => onChange({
            ...entry,
            children: [...children, newSectionEntry(defaultType)],
          })}
        >
          {t("+ Add sub-item")}
        </button>
      </div>
    </div>
  );
}

export function SectionsPropertyField({
  property, value, onChange, onImport, isImportPending, onAddPeople, defaultTypeHint,
}: {
  property: CustomProperty;
  value: { exhaustive: boolean;
    sections: SectionEntry[]; };
  onChange: (value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  /** When set, renders an "Import from Kavita" button that replaces the current sections. */
  onImport?: () => void;
  isImportPending?: boolean;
  /** Match-or-create parsed author names into the bookmark's People (paste-to-parse). */
  onAddPeople?: (names: string[]) => void;
  /**
   * Fallback entry type for new rows when the property itself has no `sectionsDefaultType` —
   * derived from the bookmark's media type (timestamp for video/audio, page for books, …).
   */
  defaultTypeHint?: SectionEntryType;
}) {
  const {
    t,
  } = useTranslation();
  const allowedTypes = property.sectionsAllowedTypes ?? [...SECTION_ENTRY_TYPES];
  const hint = defaultTypeHint && allowedTypes.includes(defaultTypeHint) ? defaultTypeHint : undefined;
  const defaultType: SectionEntryType = (property.sectionsDefaultType ?? hint ?? allowedTypes[0] ?? "url") as SectionEntryType;

  function addSection(): void {
    onChange({
      ...value,
      sections: [...value.sections, newSectionEntry(defaultType)],
    });
  }

  function appendSections(sections: SectionEntry[]): void {
    onChange({
      ...value,
      sections: [...value.sections, ...sections],
    });
  }

  function updateEntry(next: SectionEntry): void {
    onChange({
      ...value,
      sections: value.sections.map(entry => entry.id === next.id ? next : entry),
    });
  }

  function removeEntry(id: string): void {
    onChange({
      ...value,
      sections: value.sections.filter(entry => entry.id !== id),
    });
  }

  const fieldId = `property-${property.id}`;

  return (
    <div className="col-span-full space-y-2">
      <Label>{property.name}</Label>
      {value.sections.length > 0 && (
        <div className="space-y-2">
          {value.sections.map(entry => (
            <SectionRow
              key={entry.id}
              entry={entry}
              allowedTypes={allowedTypes}
              defaultType={defaultType}
              onChange={updateEntry}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="
            text-sm text-primary
            hover:underline
          "
          onClick={addSection}
        >
          {t("+ Add section")}
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
            {t("Exhaustive")}
          </Label>
        </div>
        {/* Paste-to-parse sits in the same actions row as the other list-filling tools; its
            expanded panel is w-full, so it wraps onto its own line below the row when opened. */}
        <SectionPasteParser
          allowedTypes={allowedTypes}
          defaultType={defaultType}
          onAppendSections={appendSections}
          onAddPeople={onAddPeople}
        />
        {onImport
          ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isImportPending}
              title={t("Import the linked book's table of contents (replaces the current list)")}
              onClick={onImport}
            >
              {isImportPending
                ? <Loader2 className="size-4 animate-spin" />
                : <BookOpen className="size-4" />}
              {t("Import from Kavita")}
            </Button>
          )
          : null}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}

export function TextPropertyField({
  property, fieldId, value, onChange, onFetch, isFetchPending,
}: {
  property: CustomProperty;
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
  onFetch?: (value: string) => void;
  isFetchPending?: boolean;
}) {
  const {
    t,
  } = useTranslation();
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
            title={t("Fetch metadata from Open Library")}
            aria-label={t("Fetch metadata from Open Library")}
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
export function CategoryPropertyFileField({
  property, bookmark,
}: {
  property: CustomProperty;
  bookmark: Bookmark | null;
}) {
  const {
    t,
  } = useTranslation();
  if (!bookmark) {
    return (
      <div className="space-y-1">
        <Label>{property.name}</Label>
        <p className="text-xs text-muted-foreground">
          {property.type === "image"
            ? t("Save the bookmark first, then attach an image.")
            : t("Save the bookmark first, then attach a file.")}
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
