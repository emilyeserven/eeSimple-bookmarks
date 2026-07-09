import type { DragEndEvent } from "@dnd-kit/core";
import type { WebsiteExtensionFillRule } from "@eesimple/types";

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
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SortableFillRuleRow } from "./SortableFillRuleRow";
import { LabeledSection } from "../LabeledSection";

import { Button } from "@/components/ui/button";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { newFillRuleDraft } from "@/lib/extensionFillForm";

/**
 * The whole "Extension Fill" rules editor: a dnd-kit sortable list of {@link WebsiteExtensionFillRule}
 * cards with add/remove. The custom-property picker options are resolved **once** here (file/image
 * property types excluded) and threaded down to every rule's target picker.
 */
export function ExtensionFillRulesEditor({
  rules, onChange,
}: {
  rules: WebsiteExtensionFillRule[];
  onChange: (rules: WebsiteExtensionFillRule[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  const properties = useCustomProperties();
  const propertyOptions = (properties.data ?? [])
    .filter(property => property.type !== "file" && property.type !== "image")
    .map(property => ({
      value: property.id,
      label: property.name,
    }));
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
    <LabeledSection
      title={t("Extension Fill Rules")}
      description={t(
        "Rules the browser extension uses to scrape this site's pages and offer the extracted values back to a matching bookmark.",
      )}
    >
      <div className="space-y-3">
        {rules.length > 0
          ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rules.map(rule => rule.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <SortableFillRuleRow
                      key={rule.id}
                      rule={rule}
                      propertyOptions={propertyOptions}
                      onChange={next => onChange(rules.map((current, i) => (i === index ? next : current)))}
                      onRemove={() => onChange(rules.filter((_, i) => i !== index))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
