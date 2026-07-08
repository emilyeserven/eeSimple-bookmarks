import type { FieldTarget } from "./entityLayoutMutations";
import type { CollisionDetection } from "@dnd-kit/core";
import type { EntityLayout, LayoutSection, LayoutTab } from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Move, Plus, Trash2 } from "lucide-react";

import {
  addSection,
  addTab,
  deleteSection,
  deleteTab,
  moveField,
  moveSection,
  moveTab,
  renameSection,
  renameTab,
  setTabIcon,
} from "./entityLayoutMutations";
import i18n from "../i18n";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";

/** The droppable id for the tray of unplaced fields. */
const TRAY_ID = "layout-tray";

/** Field-registry row: identity + display metadata. No entity knowledge beyond this. */
export interface LayoutFieldMeta {
  key: string;
  label: string;
  icon?: LucideIcon;
}

/** A "Move to…" menu destination: a specific section, or `null` for the unplaced tray. */
interface MoveTarget {
  label: string;
  target: FieldTarget | null;
}

interface LayoutBoardProps {
  value: EntityLayout;
  onChange: (next: EntityLayout) => void;
  /** Every known field. The tray holds those not placed in any section. */
  fields: LayoutFieldMeta[];
  idPrefix: string;
}

/** Where a drag is currently hovering, for the drop highlight. */
type OverTarget = FieldTarget | "tray" | null;

/**
 * Prefer the container the pointer is literally inside, falling back to rectangle intersection —
 * copied from `CardFieldZoneBoard`. `closestCorners` mis-resolves short/empty containers (their
 * corners bunch at the top), so the empty sections never won the drop; this is dnd-kit's recommended
 * strategy for variable-height containers.
 */
const layoutCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

/** The droppable id for a section container. */
function sectionDropId(tabKey: string, sectionKey: string): string {
  return `section:${tabKey}:${sectionKey}`;
}

/** Parse a section droppable id back into its target, or `null` when `id` isn't one. */
function parseSectionDropId(id: string): FieldTarget | null {
  if (!id.startsWith("section:")) return null;
  const [, tabKey, sectionKey] = id.split(":");
  if (!tabKey || !sectionKey) return null;
  return {
    tabKey,
    sectionKey,
  };
}

/** The section that currently holds `fieldKey`, or `null` when it's unplaced (tray). */
function homeOfField(layout: EntityLayout, fieldKey: string): FieldTarget | null {
  for (const tab of layout.tabs) {
    for (const section of tab.sections) {
      if (section.fields.includes(fieldKey)) {
        return {
          tabKey: tab.key,
          sectionKey: section.key,
        };
      }
    }
  }
  return null;
}

/** True when two targets name the same section. */
function sameTarget(a: FieldTarget, b: FieldTarget): boolean {
  return a.tabKey === b.tabKey && a.sectionKey === b.sectionKey;
}

/** A section's user-facing title, falling back to a generic label when untitled. */
function sectionTitle(section: LayoutSection): string {
  return section.title || i18n.t("Untitled section");
}

/** Build the flat "Move to…" destination list: every section across every tab, then the tray. */
function buildMoveTargets(layout: EntityLayout): MoveTarget[] {
  const targets: MoveTarget[] = [];
  for (const tab of layout.tabs) {
    for (const section of tab.sections) {
      targets.push({
        label: `${tab.label} › ${sectionTitle(section)}`,
        target: {
          tabKey: tab.key,
          sectionKey: section.key,
        },
      });
    }
  }
  targets.push({
    label: i18n.t("Unplaced"),
    target: null,
  });
  return targets;
}

/**
 * A controlled Tab › Section › Field layout editor. Create/rename/delete/reorder tabs and sections
 * (reorder via up/down buttons), and drag fields between sections — across tabs — or into the
 * "Unplaced" tray. Fields left unplaced resolve back to their default section (see the tray copy), so
 * removing a field never hides it. All tabs render expanded at once so a cross-tab field drag is a
 * visible drag; the dnd-kit context is scoped to field chips only, reusing `CardFieldZoneBoard`'s
 * proven collision/sensor settings. Standalone: no persistence, no entity knowledge beyond `fields`.
 */
export function LayoutBoard({
  value, onChange, fields, idPrefix,
}: LayoutBoardProps) {
  const fieldByKey = new Map(fields.map(field => [field.key, field]));
  const placedKeys = new Set(
    value.tabs.flatMap(tab => tab.sections.flatMap(section => section.fields)),
  );
  const unplaced = fields.filter(field => !placedKeys.has(field.key));
  const moveTargets = buildMoveTargets(value);

  // A small distance constraint lets the whole chip be a drag handle while a tap on an inner control
  // (the "Move to…" trigger) never crosses the threshold into a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor),
  );
  const [overTarget, setOverTarget] = useState<OverTarget>(null);

  /** Resolve a drag-over id to the section (or tray) it belongs to, for the highlight. */
  function resolveOver(overId: string): OverTarget {
    if (overId === TRAY_ID) return "tray";
    const section = parseSectionDropId(overId);
    if (section) return section;
    return homeOfField(value, overId) ?? "tray";
  }

  function handleDragEnd(activeId: string, overId: string | null): void {
    setOverTarget(null);
    if (!overId || overId === activeId) return;
    if (overId === TRAY_ID) {
      onChange(moveField(value, activeId, null));
      return;
    }
    const container = parseSectionDropId(overId);
    if (container) {
      onChange(moveField(value, activeId, container));
      return;
    }
    // `overId` is another chip: drop into its section at its index, or to the tray when it's unplaced.
    const home = homeOfField(value, overId);
    if (!home) {
      onChange(moveField(value, activeId, null));
      return;
    }
    const withoutActive = sectionFieldsAt(value, home).filter(key => key !== activeId);
    const index = withoutActive.indexOf(overId);
    onChange(moveField(value, activeId, home, index < 0 ? undefined : index));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={layoutCollision}
      onDragOver={({
        over,
      }) => setOverTarget(over ? resolveOver(String(over.id)) : null)}
      onDragCancel={() => setOverTarget(null)}
      onDragEnd={({
        active, over,
      }) => handleDragEnd(String(active.id), over ? String(over.id) : null)}
    >
      <div className="space-y-3">
        {value.tabs.map((tab, tabIndex) => (
          <TabGroup
            key={tab.key}
            tab={tab}
            tabIndex={tabIndex}
            tabCount={value.tabs.length}
            value={value}
            onChange={onChange}
            fieldByKey={fieldByKey}
            moveTargets={moveTargets}
            overTarget={overTarget}
            idPrefix={idPrefix}
          />
        ))}
        <AddButton
          label={i18n.t("Add tab")}
          onClick={() => onChange(addTab(value, i18n.t("New tab")))}
        />
        <UnplacedTray
          unplaced={unplaced}
          value={value}
          onChange={onChange}
          moveTargets={moveTargets}
          highlight={overTarget === "tray"}
        />
      </div>
    </DndContext>
  );
}

/** The field keys held by the section named by `target` (empty when it no longer exists). */
function sectionFieldsAt(layout: EntityLayout, target: FieldTarget): string[] {
  return layout.tabs
    .find(tab => tab.key === target.tabKey)?.sections
    .find(section => section.key === target.sectionKey)?.fields ?? [];
}

interface TabGroupProps {
  tab: LayoutTab;
  tabIndex: number;
  tabCount: number;
  value: EntityLayout;
  onChange: (next: EntityLayout) => void;
  fieldByKey: Map<string, LayoutFieldMeta>;
  moveTargets: MoveTarget[];
  overTarget: OverTarget;
  idPrefix: string;
}

/** One tab: a header (icon / rename / reorder / delete / add-section) over its section list. */
function TabGroup({
  tab, tabIndex, tabCount, value, onChange, fieldByKey, moveTargets, overTarget, idPrefix,
}: TabGroupProps) {
  return (
    <div className="rounded-md border p-2">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="w-36 shrink-0">
          <IconPicker
            value={tab.icon ?? null}
            onChange={icon => onChange(setTabIcon(value, tab.key, icon))}
            aria-label={i18n.t("Tab icon")}
            className="h-8"
          />
        </div>
        <InlineLabel
          value={tab.label}
          placeholder={i18n.t("Tab name")}
          ariaLabel={i18n.t("Tab name")}
          className="flex-1 font-medium"
          onCommit={label => onChange(renameTab(value, tab.key, label))}
        />
        <ReorderButtons
          index={tabIndex}
          count={tabCount}
          upLabel={i18n.t("Move tab left")}
          downLabel={i18n.t("Move tab right")}
          onMove={dir => onChange(moveTab(value, tab.key, dir))}
        />
        <HeaderIconButton
          label={i18n.t("Delete tab")}
          disabled={tabCount <= 1}
          onClick={() => onChange(deleteTab(value, tab.key))}
        >
          <Trash2 className="size-3.5" />
        </HeaderIconButton>
      </div>
      <div className="space-y-2 pl-1">
        {tab.sections.map((section, sectionIndex) => (
          <SectionDropArea
            key={section.key}
            tabKey={tab.key}
            section={section}
            sectionIndex={sectionIndex}
            sectionCount={tab.sections.length}
            value={value}
            onChange={onChange}
            fieldByKey={fieldByKey}
            moveTargets={moveTargets}
            highlight={isSectionHighlighted(overTarget, tab.key, section.key)}
            idPrefix={idPrefix}
          />
        ))}
        <AddButton
          label={i18n.t("Add section")}
          onClick={() => onChange(addSection(value, tab.key, i18n.t("New section")))}
        />
      </div>
    </div>
  );
}

/** Whether the drop highlight is currently on this section. */
function isSectionHighlighted(overTarget: OverTarget, tabKey: string, sectionKey: string): boolean {
  return overTarget !== null && overTarget !== "tray"
    && sameTarget(overTarget, {
      tabKey,
      sectionKey,
    });
}

interface SectionDropAreaProps {
  tabKey: string;
  section: LayoutSection;
  sectionIndex: number;
  sectionCount: number;
  value: EntityLayout;
  onChange: (next: EntityLayout) => void;
  fieldByKey: Map<string, LayoutFieldMeta>;
  moveTargets: MoveTarget[];
  highlight: boolean;
  idPrefix: string;
}

/** One section: a droppable, sortable field list with a rename / reorder / delete header. */
function SectionDropArea({
  tabKey, section, sectionIndex, sectionCount, value, onChange, fieldByKey, moveTargets, highlight,
  idPrefix,
}: SectionDropAreaProps) {
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: sectionDropId(tabKey, section.key),
  });
  const canDelete = sectionCount > 1 || section.fields.length === 0;
  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-md border border-dashed p-2
        ${isOver || highlight ? "border-primary bg-accent" : "border-input"}
      `}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <InlineLabel
          value={section.title ?? ""}
          placeholder={i18n.t("Untitled section")}
          ariaLabel={i18n.t("Section title")}
          className="flex-1 text-xs font-medium text-muted-foreground"
          onCommit={title => onChange(renameSection(value, tabKey, section.key, title))}
        />
        <ReorderButtons
          index={sectionIndex}
          count={sectionCount}
          upLabel={i18n.t("Move section up")}
          downLabel={i18n.t("Move section down")}
          onMove={dir => onChange(moveSection(value, tabKey, section.key, dir))}
        />
        <HeaderIconButton
          label={i18n.t("Delete section")}
          disabled={!canDelete}
          onClick={() => onChange(deleteSection(value, tabKey, section.key))}
        >
          <Trash2 className="size-3.5" />
        </HeaderIconButton>
      </div>
      <SortableContext items={section.fields}>
        <div className="flex flex-wrap gap-1.5">
          {section.fields.length === 0
            ? <p className="text-xs text-muted-foreground">{i18n.t("Drop fields here")}</p>
            : section.fields.map(fieldKey => (
              <LayoutFieldChip
                key={fieldKey}
                field={fieldByKey.get(fieldKey) ?? {
                  key: fieldKey,
                  label: fieldKey,
                }}
                idPrefix={idPrefix}
                moveTargets={moveTargets}
                onMoveTo={target => onChange(moveField(value, fieldKey, target))}
              />
            ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface UnplacedTrayProps {
  unplaced: LayoutFieldMeta[];
  value: EntityLayout;
  onChange: (next: EntityLayout) => void;
  moveTargets: MoveTarget[];
  highlight: boolean;
}

/**
 * The tray of fields not placed in any section. A field left here isn't hidden — it resolves back to
 * its default section (the copy says so), which is why this is "Unplaced", not "Hidden".
 */
function UnplacedTray({
  unplaced, value, onChange, moveTargets, highlight,
}: UnplacedTrayProps) {
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: TRAY_ID,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-md border border-dashed p-2
        ${isOver || highlight ? "border-primary bg-accent" : "border-input"}
      `}
    >
      <p className="mb-0.5 text-xs font-medium text-muted-foreground">{i18n.t("Unplaced fields")}</p>
      <p className="mb-1.5 text-[11px] text-muted-foreground/80">
        {i18n.t("A field left here returns to its default section — it isn't hidden.")}
      </p>
      <SortableContext items={unplaced.map(field => field.key)}>
        <div className="flex flex-wrap gap-1.5">
          {unplaced.length === 0
            ? <p className="text-xs text-muted-foreground">{i18n.t("All fields are placed.")}</p>
            : unplaced.map(field => (
              <LayoutFieldChip
                key={field.key}
                field={field}
                idPrefix="tray"
                moveTargets={moveTargets}
                onMoveTo={target => onChange(moveField(value, field.key, target))}
              />
            ))}
        </div>
      </SortableContext>
    </div>
  );
}

/** Stop a pointer-down on an interactive control from starting a chip drag. */
const stopDrag = (event: React.PointerEvent) => event.stopPropagation();

interface LayoutFieldChipProps {
  field: LayoutFieldMeta;
  idPrefix: string;
  moveTargets: MoveTarget[];
  onMoveTo: (target: FieldTarget | null) => void;
}

/**
 * A draggable, sortable field chip. The whole chip is a drag handle (a tap on the "Move to…" trigger
 * never crosses the sensor's distance threshold); the menu offers tap-to-assign for touch and the
 * cross-tab / keyboard path.
 */
function LayoutFieldChip({
  field, idPrefix, moveTargets, onMoveTo,
}: LayoutFieldChipProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: field.key,
  });
  const Icon = field.icon;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={`
        flex cursor-grab touch-none items-center gap-1.5 rounded-md border
        bg-card px-2 py-1 text-sm
        ${isDragging ? "opacity-50" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      {Icon
        ? (
          <Icon
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )
        : null}
      <span className="min-w-0">{field.label}</span>
      <MoveToMenu
        fieldLabel={field.label}
        idPrefix={idPrefix}
        moveTargets={moveTargets}
        onMoveTo={onMoveTo}
      />
    </div>
  );
}

interface MoveToMenuProps {
  fieldLabel: string;
  idPrefix: string;
  moveTargets: MoveTarget[];
  onMoveTo: (target: FieldTarget | null) => void;
}

/** The chip's "Move to…" dropdown: every section across every tab, plus the tray. */
function MoveToMenu({
  fieldLabel, idPrefix, moveTargets, onMoveTo,
}: MoveToMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 text-muted-foreground"
          aria-label={i18n.t("Move {{label}} to…", {
            label: fieldLabel,
          })}
          onPointerDown={stopDrag}
        >
          <Move className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{i18n.t("Move to…")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {moveTargets.map(target => (
          <DropdownMenuItem
            key={`${idPrefix}-${target.label}`}
            onSelect={() => onMoveTo(target.target)}
          >
            {target.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface InlineLabelProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  onCommit: (value: string) => void;
}

/** A label that turns into a text input on click and commits on blur / Enter (Escape cancels). */
function InlineLabel({
  value, placeholder, ariaLabel, className, onCommit,
}: InlineLabelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        aria-label={ariaLabel}
        className="h-7 flex-1 text-sm"
        onChange={event => setDraft(event.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <button
      type="button"
      className={`
        truncate rounded-sm px-1 text-left
        hover:bg-accent
        ${className ?? ""}
      `}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  );
}

interface ReorderButtonsProps {
  index: number;
  count: number;
  upLabel: string;
  downLabel: string;
  onMove: (dir: -1 | 1) => void;
}

/** A move-up / move-down pair, each disabled at the array boundary. */
function ReorderButtons({
  index, count, upLabel, downLabel, onMove,
}: ReorderButtonsProps) {
  return (
    <>
      <HeaderIconButton
        label={upLabel}
        disabled={index <= 0}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="size-3.5" />
      </HeaderIconButton>
      <HeaderIconButton
        label={downLabel}
        disabled={index >= count - 1}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="size-3.5" />
      </HeaderIconButton>
    </>
  );
}

interface HeaderIconButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** A compact icon button used across the tab / section headers. */
function HeaderIconButton({
  label, disabled = false, onClick, children,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="
        shrink-0 rounded-sm p-1 text-muted-foreground
        hover:bg-accent hover:text-foreground
        disabled:pointer-events-none disabled:opacity-40
      "
    >
      {children}
    </button>
  );
}

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

/** A dashed "Add tab" / "Add section" button. */
function AddButton({
  label, onClick,
}: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center gap-1 rounded-md border border-dashed border-input
        px-2 py-1 text-xs text-muted-foreground
        hover:border-primary hover:text-foreground
      "
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  );
}
