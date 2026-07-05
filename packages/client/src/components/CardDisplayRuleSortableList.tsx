import type { DragEndEvent } from "@dnd-kit/core";
import type { CardDisplayRule } from "@eesimple/types";

import { useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import {
  useOptimisticReorderCardDisplayRules,
  useReorderCardDisplayRules,
} from "../hooks/useCardDisplayRules";

/** Sortable wrapper for a single (non-default) rule card. */
function SortableRuleCard({
  rule,
}: { rule: CardDisplayRule }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: rule.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <CardDisplayRuleCard
        rule={rule}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface CardDisplayRuleSortableListProps {
  serverRules: CardDisplayRule[] | undefined;
  isLoading: boolean;
}

/** The prioritized, drag-sortable list of non-default card display rules. */
export function CardDisplayRuleSortableList({
  serverRules, isLoading,
}: CardDisplayRuleSortableListProps) {
  const {
    t,
  } = useTranslation();
  const [localRules, setLocalRules] = useState<CardDisplayRule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reorder = useReorderCardDisplayRules();
  const setOptimisticOrder = useOptimisticReorderCardDisplayRules();

  useEffect(() => {
    if (serverRules) setLocalRules(serverRules);
  }, [serverRules]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedRules = localRules.filter(rule => !rule.isDefault);
  const defaultRule = localRules.find(rule => rule.isDefault);

  function handleDragEnd(event: DragEndEvent) {
    const {
      active, over,
    } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = orderedRules.findIndex(r => r.id === active.id);
    const newIndex = orderedRules.findIndex(r => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(orderedRules, oldIndex, newIndex);
    const nextLocal = defaultRule ? [...reordered, defaultRule] : reordered;
    setLocalRules(nextLocal);
    setOptimisticOrder(nextLocal);
    reorder.mutate(reordered.map(r => r.id));
  }

  const activeRule = activeId ? orderedRules.find(r => r.id === activeId) : null;

  return (
    <>
      {!isLoading && orderedRules.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            {t("No rules yet. Add one to override how matching bookmark cards display.")}
          </p>
        )
        : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({
          active,
        }) => setActiveId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext
          items={orderedRules.map(r => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedRules.length > 0
            ? (
              <div className="space-y-3">
                {orderedRules.map(rule => (
                  <SortableRuleCard
                    key={rule.id}
                    rule={rule}
                  />
                ))}
              </div>
            )
            : null}
        </SortableContext>

        <DragOverlay>
          {activeRule
            ? (
              <CardDisplayRuleCard
                rule={activeRule}
                isDragging
              />
            )
            : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
