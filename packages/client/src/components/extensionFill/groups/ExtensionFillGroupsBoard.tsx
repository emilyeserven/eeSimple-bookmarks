import type { EditorState } from "../../../hooks/useExtensionFillRulesEditor";
import type { ComboboxOption } from "../../Combobox";
import type { CollisionDetection, DragEndEvent } from "@dnd-kit/core";
import type { ExtensionFillOverrides, ExtensionFillRuleGroup, OverrideKey, WebsiteExtensionFillRule } from "@eesimple/types";
import type { ReactNode } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LogOut, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GroupOverridesEditor } from "./GroupOverridesEditor";
import { LabeledInput } from "../controls";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import {
  addGroup,
  assignRuleToGroup,
  clearGroupOverride,
  deleteGroup,
  removeRuleFromGroup,
  renameGroup,
  reorderRuleWithinGroup,
  setGroupOverride,
} from "@/lib/extensionFillGroups";

/** Collision detection tuned for empty containers (pointerWithin, then rectIntersection fallback). */
const boardCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

const UNGROUPED_ID = "ungrouped";
const groupDropId = (id: string) => `group:${id}`;

interface BoardProps {
  rules: WebsiteExtensionFillRule[];
  groups: ExtensionFillRuleGroup[];
  onRulesChange: (rules: WebsiteExtensionFillRule[]) => void;
  onGroupsChange: (groups: ExtensionFillRuleGroup[]) => void;
  onReplace: (next: EditorState) => void;
}

/**
 * The Groups sub-tab: a two-tier drag-and-drop board (modeled on `LayoutBoard`/`CardDisplaySectionBoard`).
 * Drag rules within/between groups to re-home + reorder; **joining a group overwrites** the rule's
 * options with the group's, while pulling a rule out is an explicit per-rule button (never a drag).
 * Each group card also edits which options it overrides.
 */
export function ExtensionFillGroupsBoard({
  rules, groups, onRulesChange, onGroupsChange, onReplace,
}: BoardProps) {
  const {
    t,
  } = useTranslation();
  const {
    propertyOptions, sectionsOptions,
  } = useOverrideOptionLists();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const topGroups = groups.filter(group => !group.parentId);
  const ungrouped = rules.filter(rule => !rule.groupId);

  function handleDragEnd(event: DragEndEvent): void {
    const {
      active, over,
    } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    const activeRule = rules.find(rule => rule.id === activeId);
    if (!activeRule) return;

    const target = resolveDropTarget(overId, rules);
    if (target === null) return;
    const {
      groupId: targetGroupId, beforeRuleId,
    } = target;

    if (targetGroupId === activeRule.groupId) {
      onRulesChange(reorderRuleWithinGroup(rules, activeId, beforeRuleId));
      return;
    }
    // Dragging out to the ungrouped tray is disallowed — removal needs the explicit button.
    if (targetGroupId === undefined) return;
    onRulesChange(assignRuleToGroup(groups, rules, activeId, targetGroupId, beforeRuleId));
  }

  const groupActions = {
    groups,
    rules,
    propertyOptions,
    sectionsOptions,
    onRename: (id: string, label: string) => onGroupsChange(renameGroup(groups, id, label)),
    onDelete: (id: string) => onReplace(deleteGroup(groups, rules, id)),
    onAddChild: (parentId: string) => onGroupsChange(addGroup(groups, t("New subgroup"), parentId).groups),
    onSetOverride: (id: string, key: OverrideKey, value: ExtensionFillOverrides[OverrideKey]) =>
      onGroupsChange(setGroupOverride(groups, id, key, value as never)),
    onClearOverride: (id: string, key: OverrideKey) => onGroupsChange(clearGroupOverride(groups, id, key)),
    onRemoveRule: (ruleId: string) => onRulesChange(removeRuleFromGroup(rules, ruleId)),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("Rule groups")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("Group rules that share options. A group's overrides are locked (read-only) on its rules.")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onGroupsChange(addGroup(groups, t("New group")).groups)}
        >
          <Plus className="mr-1 size-4" />
          {t("Add group")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={boardCollision}
        onDragEnd={handleDragEnd}
      >
        {topGroups.length === 0
          ? <p className="text-sm text-muted-foreground">{t("No groups yet.")}</p>
          : null}
        {topGroups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            {...groupActions}
          />
        ))}

        <UngroupedTray rules={ungrouped} />
      </DndContext>
    </div>
  );
}

/** Fillable + sections custom-property option lists for the override editors. */
function useOverrideOptionLists(): { propertyOptions: ComboboxOption[];
  sectionsOptions: ComboboxOption[]; } {
  const properties = useCustomProperties();
  const all = (properties.data ?? []).filter(property => property.type !== "file" && property.type !== "image");
  return {
    propertyOptions: all.map(property => ({
      value: property.id,
      label: property.name,
    })),
    sectionsOptions: all.filter(property => property.type === "sections").map(property => ({
      value: property.id,
      label: property.name,
    })),
  };
}

/** Resolve a drop target id to a `{ groupId, beforeRuleId }` (groupId undefined = the ungrouped tray). */
function resolveDropTarget(
  overId: string,
  rules: WebsiteExtensionFillRule[],
): { groupId: string | undefined;
  beforeRuleId?: string; } | null {
  if (overId === UNGROUPED_ID) return {
    groupId: undefined,
  };
  if (overId.startsWith("group:")) return {
    groupId: overId.slice("group:".length),
  };
  const overRule = rules.find(rule => rule.id === overId);
  if (!overRule) return null;
  return {
    groupId: overRule.groupId,
    beforeRuleId: overRule.id,
  };
}

interface GroupActions {
  groups: ExtensionFillRuleGroup[];
  rules: WebsiteExtensionFillRule[];
  propertyOptions: ComboboxOption[];
  sectionsOptions: ComboboxOption[];
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onSetOverride: (id: string, key: OverrideKey, value: ExtensionFillOverrides[OverrideKey]) => void;
  onClearOverride: (id: string, key: OverrideKey) => void;
  onRemoveRule: (ruleId: string) => void;
}

/** One top-level group card: header + overrides + its rules, then any nested child groups. */
function GroupCard({
  group, ...actions
}: GroupActions & { group: ExtensionFillRuleGroup }) {
  const {
    t,
  } = useTranslation();
  const childGroups = actions.groups.filter(candidate => candidate.parentId === group.id);
  return (
    <RowCard className="mb-3 space-y-3 p-3">
      <GroupHeader
        group={group}
        onRename={actions.onRename}
        onDelete={actions.onDelete}
        onAddChild={actions.onAddChild}
        canAddChild
      />
      <GroupOverridesEditor
        group={group}
        propertyOptions={actions.propertyOptions}
        sectionsOptions={actions.sectionsOptions}
        onSetOverride={(key, value) => actions.onSetOverride(group.id, key, value)}
        onClearOverride={key => actions.onClearOverride(group.id, key)}
      />
      <RuleDropZone
        dropId={groupDropId(group.id)}
        rules={actions.rules.filter(rule => rule.groupId === group.id)}
        onRemoveRule={actions.onRemoveRule}
      />
      {childGroups.map(child => (
        <div
          key={child.id}
          className="ml-3 space-y-2 border-l pl-3"
        >
          <GroupHeader
            group={child}
            onRename={actions.onRename}
            onDelete={actions.onDelete}
            onAddChild={actions.onAddChild}
            canAddChild={false}
          />
          <GroupOverridesEditor
            group={child}
            propertyOptions={actions.propertyOptions}
            sectionsOptions={actions.sectionsOptions}
            onSetOverride={(key, value) => actions.onSetOverride(child.id, key, value)}
            onClearOverride={key => actions.onClearOverride(child.id, key)}
          />
          <RuleDropZone
            dropId={groupDropId(child.id)}
            rules={actions.rules.filter(rule => rule.groupId === child.id)}
            onRemoveRule={actions.onRemoveRule}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("Drag rules here to add them (their values are overwritten by this group).")}</p>
    </RowCard>
  );
}

/** A group's header row: editable name + add-subgroup + delete. */
function GroupHeader({
  group, onRename, onDelete, onAddChild, canAddChild,
}: {
  group: ExtensionFillRuleGroup;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  canAddChild: boolean;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-end gap-2">
      <LabeledInput
        className="flex-1"
        label={t("Group name")}
        value={group.label}
        onChange={label => onRename(group.id, label)}
      />
      {canAddChild
        ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(group.id)}
          >
            <Plus className="mr-1 size-4" />
            {t("Subgroup")}
          </Button>
        )
        : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("Delete group")}
        onClick={() => onDelete(group.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

/** A droppable, sortable list of rule chips for one group (or the ungrouped tray). */
function RuleDropZone({
  dropId, rules, onRemoveRule,
}: {
  dropId: string;
  rules: WebsiteExtensionFillRule[];
  onRemoveRule?: (ruleId: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    setNodeRef, isOver,
  } = useDroppable({
    id: dropId,
  });
  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-10 rounded-md border border-dashed p-2
        ${isOver
      ? "border-primary bg-accent/40"
      : "border-muted"}
      `}
    >
      <SortableContext
        items={rules.map(rule => rule.id)}
        strategy={rectSortingStrategy}
      >
        {rules.length === 0
          ? <p className="text-xs text-muted-foreground">{t("Drop rules here.")}</p>
          : (
            <div className="space-y-1">
              {rules.map(rule => (
                <GroupRuleChip
                  key={rule.id}
                  rule={rule}
                  onRemoveRule={onRemoveRule}
                />
              ))}
            </div>
          )}
      </SortableContext>
    </div>
  );
}

/** A single draggable rule chip: drag handle + label + (in a group) an explicit "Remove" button. */
function GroupRuleChip({
  rule, onRemoveRule,
}: {
  rule: WebsiteExtensionFillRule;
  onRemoveRule?: (ruleId: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: rule.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const dragHandle: ReactNode = (
    <button
      type="button"
      className="cursor-grab touch-none text-muted-foreground"
      aria-label={t("Drag rule")}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-sm
        ${isDragging
      ? "opacity-50"
      : ""}
      `}
    >
      {dragHandle}
      <span className="flex-1 truncate">{rule.label.trim() || t("Untitled rule")}</span>
      {onRemoveRule && rule.groupId
        ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => onRemoveRule(rule.id)}
          >
            <LogOut className="size-3.5" />
            {t("Remove")}
          </Button>
        )
        : null}
    </div>
  );
}

/** The tray of ungrouped rules — a drag source. Dropping a grouped rule here is ignored (see board). */
function UngroupedTray({
  rules,
}: {
  rules: WebsiteExtensionFillRule[];
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="mt-2">
      <p className="mb-1 text-sm font-medium">{t("Ungrouped rules")}</p>
      <RuleDropZone
        dropId={UNGROUPED_ID}
        rules={rules}
      />
    </div>
  );
}
