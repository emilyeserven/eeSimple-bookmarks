import type { ComboboxOption } from "../Combobox";
import type { DragEndEvent } from "@dnd-kit/core";
import type { CustomProperty, ExtensionFillRuleGroup, WebsiteExtensionFillRule } from "@eesimple/types";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FillRuleCard, SortableFillRuleRow } from "./SortableFillRuleRow";
import { LabeledSection } from "../LabeledSection";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { duplicateFillRule, newFillRuleDraft } from "@/lib/extensionFillForm";
import { lockedKeysForRule } from "@/lib/extensionFillGroups";

/** Fillable custom-property option lists resolved once (file/image types excluded). */
function useFillablePropertyOptions() {
  const properties = useCustomProperties();
  const fillableProperties = (properties.data ?? [])
    .filter(property => property.type !== "file" && property.type !== "image");
  return {
    propertyOptions: fillableProperties.map(property => ({
      value: property.id,
      label: property.name,
    })),
    propertiesById: new Map(fillableProperties.map(property => [property.id, property])),
  };
}

/**
 * The "Extension Fill" rules list (Rules sub-tab): a dnd-kit sortable list of ungrouped
 * {@link WebsiteExtensionFillRule} cards, plus a **collapsible section per rule group** whose member
 * rules render with their group-overridden options read-only ({@link lockedKeysForRule}). Grouping
 * itself is edited on the Groups sub-tab; here a grouped rule's remaining fields stay editable.
 */
export function ExtensionFillRulesEditor({
  rules, groups, onChange,
}: {
  rules: WebsiteExtensionFillRule[];
  groups: ExtensionFillRuleGroup[];
  onChange: (rules: WebsiteExtensionFillRule[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    propertyOptions, propertiesById,
  } = useFillablePropertyOptions();

  function changeRule(next: WebsiteExtensionFillRule): void {
    onChange(rules.map(rule => (rule.id === next.id ? next : rule)));
  }
  function removeRule(id: string): void {
    onChange(rules.filter(rule => rule.id !== id));
  }
  function duplicateRule(rule: WebsiteExtensionFillRule): void {
    const index = rules.findIndex(current => current.id === rule.id);
    onChange([...rules.slice(0, index + 1), duplicateFillRule(rule), ...rules.slice(index + 1)]);
  }

  const ungrouped = rules.filter(rule => !rule.groupId);
  const topGroups = groups.filter(group => !group.parentId);

  const cardProps = {
    propertyOptions,
    propertiesById,
    onChangeRule: changeRule,
    onRemoveRule: removeRule,
    onDuplicateRule: duplicateRule,
  };

  return (
    <LabeledSection
      title={t("Extension Fill Rules")}
      description={t(
        "Rules the browser extension uses to scrape this site's pages and offer the extracted values back to a matching bookmark.",
      )}
    >
      <div className="space-y-4">
        {rules.length === 0
          ? <p className="text-sm text-muted-foreground">{t("No extension fill rules yet.")}</p>
          : null}

        {topGroups.map(group => (
          <GroupCollapsible
            key={group.id}
            group={group}
            groups={groups}
            rules={rules}
            {...cardProps}
          />
        ))}

        {ungrouped.length > 0
          ? (
            <UngroupedRulesList
              rules={rules}
              ungrouped={ungrouped}
              onChange={onChange}
              {...cardProps}
            />
          )
          : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rules, newFillRuleDraft()])}
        >
          <Plus className="mr-1 size-4" />
          {t("Add extraction rule")}
        </Button>
      </div>
    </LabeledSection>
  );
}

/** Common props threaded to the per-rule cards. */
interface RuleCardActions {
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChangeRule: (rule: WebsiteExtensionFillRule) => void;
  onRemoveRule: (id: string) => void;
  onDuplicateRule: (rule: WebsiteExtensionFillRule) => void;
}

/** A collapsible section for one top-level group: its own rules, then each child group's rules. */
function GroupCollapsible({
  group, groups, rules, ...actions
}: RuleCardActions & {
  group: ExtensionFillRuleGroup;
  groups: ExtensionFillRuleGroup[];
  rules: WebsiteExtensionFillRule[];
}) {
  const childGroups = groups.filter(candidate => candidate.parentId === group.id);
  const ownRules = rules.filter(rule => rule.groupId === group.id);
  return (
    <Collapsible
      defaultOpen
      className="rounded-lg border"
    >
      <GroupCollapsibleTrigger
        label={group.label}
        count={ownRules.length + rules.filter(r => childGroups.some(c => c.id === r.groupId)).length}
      />
      <CollapsibleContent className="space-y-3 p-3 pt-0">
        <GroupRulesList
          groups={groups}
          rules={ownRules}
          {...actions}
        />
        {childGroups.map(child => (
          <div
            key={child.id}
            className="ml-3 border-l pl-3"
          >
            <p className="mb-2 text-xs font-medium text-muted-foreground">{child.label}</p>
            <GroupRulesList
              groups={groups}
              rules={rules.filter(rule => rule.groupId === child.id)}
              {...actions}
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** The collapsible trigger row: chevron + group name + member count. */
function GroupCollapsibleTrigger({
  label, count,
}: {
  label: string;
  count: number;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <CollapsibleTrigger
      className="
        group/section flex w-full items-center gap-2 p-3 text-left text-sm
        font-medium
      "
    >
      <ChevronRight
        className="
          size-4 shrink-0 transition-transform
          group-data-[state=open]/section:rotate-90
        "
      />
      <span className="flex-1">{label}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {t("{{count}} rules", {
          count,
        })}
      </span>
    </CollapsibleTrigger>
  );
}

/** A non-draggable list of rule cards (grouped rules), each with its group-locked options read-only. */
function GroupRulesList({
  groups, rules, propertyOptions, propertiesById, onChangeRule, onRemoveRule, onDuplicateRule,
}: RuleCardActions & {
  groups: ExtensionFillRuleGroup[];
  rules: WebsiteExtensionFillRule[];
}) {
  const {
    t,
  } = useTranslation();
  if (rules.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("No rules in this group yet.")}</p>;
  }
  return (
    <div className="space-y-3">
      {rules.map(rule => (
        <FillRuleCard
          key={rule.id}
          rule={rule}
          propertyOptions={propertyOptions}
          propertiesById={propertiesById}
          lockedKeys={lockedKeysForRule(groups, rule)}
          onChange={onChangeRule}
          onRemove={() => onRemoveRule(rule.id)}
          onDuplicate={() => onDuplicateRule(rule)}
        />
      ))}
    </div>
  );
}

/** The dnd-kit sortable list of ungrouped rules (drag-to-reorder, as before groups existed). */
function UngroupedRulesList({
  rules, ungrouped, onChange, propertyOptions, propertiesById, onChangeRule, onRemoveRule, onDuplicateRule,
}: RuleCardActions & {
  rules: WebsiteExtensionFillRule[];
  ungrouped: WebsiteExtensionFillRule[];
  onChange: (rules: WebsiteExtensionFillRule[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const {
      active, over,
    } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex(rule => rule.id === active.id);
    const newIndex = rules.findIndex(rule => rule.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(rules, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ungrouped.map(rule => rule.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {ungrouped.map(rule => (
            <SortableFillRuleRow
              key={rule.id}
              rule={rule}
              propertyOptions={propertyOptions}
              propertiesById={propertiesById}
              onChange={onChangeRule}
              onRemove={() => onRemoveRule(rule.id)}
              onDuplicate={() => onDuplicateRule(rule)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
