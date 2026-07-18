import type { SectionTypeScope } from "@/lib/sectionBulkType";
import type { CustomProperty, SectionEntry, SectionEntryType } from "@eesimple/types";

import { useState } from "react";

import { SECTION_ENTRY_TYPES, SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FieldDescription } from "./FieldDescription";
import { newSectionEntry } from "./sectionEntry";
import { SectionRow } from "./sectionRow";
import { SectionCollapseToggle } from "../SectionCollapseToggle";
import { SectionPasteParser } from "../SectionPasteParser";
import { SectionsAiImportDialog } from "../SectionsAiImportDialog";
import { SectionsSummary } from "../SectionsSummary";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyBulkSectionType } from "@/lib/sectionBulkType";

const SECTION_TYPE_SCOPE_LABELS: Record<SectionTypeScope, string> = {
  all: "All entries",
  sections: "Sections",
  subsections: "Sub-sections",
};

/**
 * Bulk-set the entry type across a Sections list. Offers a scope (`All entries` / `Sections` /
 * `Sub-sections` when the property is tiered, else just `All entries`) and a type over `allowedTypes`,
 * then applies via the pure {@link applyBulkSectionType}. Only rendered when more than one type is
 * allowed (otherwise there's no choice to make).
 */
function SectionBulkTypeControl({
  allowedTypes, tiered, onApply,
}: {
  allowedTypes: SectionEntryType[];
  tiered: boolean;
  onApply: (scope: SectionTypeScope, type: SectionEntryType) => void;
}) {
  const {
    t,
  } = useTranslation();
  const scopes: SectionTypeScope[] = tiered ? ["all", "sections", "subsections"] : ["all"];
  const [scope, setScope] = useState<SectionTypeScope>("all");
  const [type, setType] = useState<SectionEntryType>(allowedTypes[0]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("Set type")}</span>
      {scopes.length > 1
        ? (
          <Select
            value={scope}
            onValueChange={next => setScope(next as SectionTypeScope)}
          >
            <SelectTrigger className="h-8 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopes.map(s => (
                <SelectItem
                  key={s}
                  value={s}
                >{t(SECTION_TYPE_SCOPE_LABELS[s])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        : null}
      <Select
        value={type}
        onValueChange={next => setType(next as SectionEntryType)}
      >
        <SelectTrigger className="h-8 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedTypes.map(entryType => (
            <SelectItem
              key={entryType}
              value={entryType}
            >{t(SECTION_ENTRY_TYPE_LABELS[entryType])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onApply(scope, type)}
      >
        {t("Apply")}
      </Button>
    </div>
  );
}

/**
 * Confirm-gated "Clear all sections" control. Because the property form auto-saves shortly after any
 * change with no undo, wiping the whole list sits behind a confirm dialog — mirrors {@link PruneEmptyButton}.
 * Only rendered when there is at least one section to clear.
 */
function ClearAllSectionsButton({
  count, onClear,
}: {
  count: number;
  onClear: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
        >
          <Trash2 className="size-4" />
          {t("Clear all sections")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Clear all {{count}} sections?", {
            count,
          })}
          </DialogTitle>
          <DialogDescription>{t("This cannot be undone.")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            {t("Clear all")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SectionsPropertyField({
  property, value, onChange, onImport, isImportPending, onAddPeople, defaultTypeHint, bookmarkTitle,
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
  /** Names the book in the AI-import dialog's generated prompt; null/absent = a generic phrasing. */
  bookmarkTitle?: string | null;
}) {
  const {
    t,
  } = useTranslation();
  const allowedTypes = property.sectionsAllowedTypes ?? [...SECTION_ENTRY_TYPES];
  const hint = defaultTypeHint && allowedTypes.includes(defaultTypeHint) ? defaultTypeHint : undefined;
  const defaultType: SectionEntryType = (property.sectionsDefaultType ?? hint ?? allowedTypes[0] ?? "url") as SectionEntryType;
  const [collapsed, setCollapsed] = useState(false);

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
      <div className="flex items-center gap-2">
        {value.sections.length > 0
          ? (
            <SectionCollapseToggle
              collapsed={collapsed}
              onToggle={() => setCollapsed(prev => !prev)}
              label={collapsed ? t("Expand all sections") : t("Collapse all sections")}
            />
          )
          : null}
        <Label>{property.name}</Label>
        {value.sections.length > 0 && collapsed
          ? <SectionsSummary sections={value.sections} />
          : null}
      </div>
      {value.sections.length > 0 && !collapsed && (
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
        {allowedTypes.length > 1 && value.sections.length > 0
          ? (
            <SectionBulkTypeControl
              allowedTypes={allowedTypes}
              tiered={property.sectionsTiered === true}
              onApply={(scope, type) => onChange({
                ...value,
                sections: applyBulkSectionType(value.sections, scope, type),
              })}
            />
          )
          : null}
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
        <SectionsAiImportDialog
          bookmarkTitle={bookmarkTitle ?? null}
          allowedTypes={allowedTypes}
          onApply={onChange}
        />
        {value.sections.length > 0
          ? (
            <ClearAllSectionsButton
              count={value.sections.length}
              onClear={() => onChange({
                ...value,
                sections: [],
              })}
            />
          )
          : null}
      </div>
      <FieldDescription text={property.description} />
    </div>
  );
}
