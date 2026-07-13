import type { PinnedSection, PinnedSidebarEntityType, PinnedSidebarItem } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { usePinManagerData } from "./usePinManagerData";
import { usePinSectionManager } from "./usePinSectionManager";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const UNGROUPED_VALUE = "__ungrouped__";

/** One pin: reorder up/down, its resolved label, a section-assignment select, and an unpin button. */
function PinRow({
  pin, label, sections, isFirst, isLast, onMove, onAssign, onRemove,
}: {
  pin: PinnedSidebarItem;
  label: string | null;
  sections: PinnedSection[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: number) => void;
  onAssign: (sectionId: string | null) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          className="
            text-muted-foreground
            hover:text-foreground
            disabled:opacity-30
          "
          disabled={isFirst}
          aria-label={t("Move up")}
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          className="
            text-muted-foreground
            hover:text-foreground
            disabled:opacity-30
          "
          disabled={isLast}
          aria-label={t("Move down")}
          onClick={() => onMove(1)}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
      <span
        className={cn(
          "flex-1 truncate text-sm",
          !label && "text-muted-foreground italic",
        )}
      >
        {label ?? t("(deleted)")}
      </span>
      <Select
        value={pin.sectionId ?? UNGROUPED_VALUE}
        onValueChange={value => onAssign(value === UNGROUPED_VALUE ? null : value)}
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-36 shrink-0"
          aria-label={t("Assign section")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNGROUPED_VALUE}>{t("Ungrouped")}</SelectItem>
          {sections.map(section => (
            <SelectItem
              key={section.id}
              value={section.id}
            >
              {section.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        onClick={onRemove}
      >
        <X className="size-3.5" />
        <span className="sr-only">{t("Unpin {{label}}", {
          label: label ?? t("item"),
        })}
        </span>
      </Button>
    </div>
  );
}

/** A section heading with inline rename, reorder up/down, and delete controls. */
function PinSectionHeader({
  section, isFirst, isLast, onRename, onMove, onDelete,
}: {
  section: PinnedSection;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center gap-1 pt-2">
      <Input
        defaultValue={section.name}
        aria-label={t("Section name")}
        className="h-7 flex-1 text-sm font-medium"
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (next && next !== section.name) onRename(next);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        disabled={isFirst}
        aria-label={t("Move section up")}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        disabled={isLast}
        aria-label={t("Move section down")}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        aria-label={t("Delete section {{name}}", {
          name: section.name,
        })}
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

/**
 * Shared body for pin management: a combobox to pin any category / tag / website / media type /
 * YouTube channel / saved filter as a quick-access sidebar link, user-defined sections that group
 * pins, and the list of current pins (grouped by section) with per-pin section assignment and unpin
 * buttons. Used by the Settings `PinnedItemsCard`.
 */
export function PinManager() {
  const {
    t,
  } = useTranslation();
  const {
    pins, addPin, removePin, groups, resolvePinLabel,
  } = usePinManagerData();
  const {
    sections, createSection, renameSection, deleteSection, moveSection, movePin, assignPin,
  } = usePinSectionManager();
  const [comboValue, setComboValue] = useState<string | undefined>();
  const [newSectionName, setNewSectionName] = useState("");

  function handleSelect(value: string | undefined) {
    if (!value) return;
    const colonIdx = value.indexOf(":");
    const entityType = value.slice(0, colonIdx) as PinnedSidebarEntityType;
    const entityId = value.slice(colonIdx + 1);
    addPin.mutate({
      entityType,
      entityId,
    });
    setComboValue(undefined);
  }

  function handleAddSection() {
    const name = newSectionName.trim();
    if (!name) return;
    createSection(name);
    setNewSectionName("");
  }

  const sectionIds = new Set(sections.map(s => s.id));
  const ungroupedPins = pins.filter(p => p.sectionId === null || !sectionIds.has(p.sectionId));

  function renderPin(pin: PinnedSidebarItem, index: number, group: PinnedSidebarItem[]) {
    return (
      <PinRow
        key={pin.id}
        pin={pin}
        label={resolvePinLabel(pin)}
        sections={sections}
        isFirst={index === 0}
        isLast={index === group.length - 1}
        onMove={delta => movePin(pin.id, delta, pins)}
        onAssign={sectionId => assignPin(pin.id, sectionId)}
        onRemove={() => removePin.mutate(pin.id)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Combobox
        groups={groups}
        value={comboValue}
        onValueChange={handleSelect}
        placeholder={t("Pin a category, location, tag…")}
        searchPlaceholder={t("Search…")}
        emptyText={t("Nothing left to pin.")}
      />

      <div className="flex items-center gap-2">
        <Input
          value={newSectionName}
          onChange={e => setNewSectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSection();
            }
          }}
          placeholder={t("New section name…")}
          className="h-8 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSection}
          disabled={!newSectionName.trim()}
        >
          <Plus className="size-4" />
          {t("Add section")}
        </Button>
      </div>

      {pins.length === 0
        ? <p className="text-sm text-muted-foreground">{t("No pinned items yet.")}</p>
        : (
          <div className="space-y-1">
            {ungroupedPins.map(renderPin)}
            {sections.map((section, index) => (
              <div key={section.id}>
                <PinSectionHeader
                  section={section}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  onRename={name => renameSection(section.id, name)}
                  onMove={delta => moveSection(section.id, delta)}
                  onDelete={() => deleteSection(section.id)}
                />
                <div className="pl-2">
                  {pins.filter(p => p.sectionId === section.id).map(renderPin)}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
