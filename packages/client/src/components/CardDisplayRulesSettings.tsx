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
import { emptyConditionTree } from "@eesimple/types";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { CardDisplayRuleInspector } from "./CardDisplayRuleInspector";
import {
  useCardDisplayRules,
  useCreateCardDisplayRule,
  useOptimisticReorderCardDisplayRules,
  useReorderCardDisplayRules,
} from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

/** Settings panel: a prioritized, drag-sortable list of card display rules + the pinned Default rule. */
export function CardDisplayRulesSettings() {
  const {
    data: serverRules, isLoading,
  } = useCardDisplayRules();
  const navigate = useNavigate();
  const [localRules, setLocalRules] = useState<CardDisplayRule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const create = useCreateCardDisplayRule();
  const reorder = useReorderCardDisplayRules();
  const setOptimisticOrder = useOptimisticReorderCardDisplayRules();

  /** Create a blank rule and jump straight to its edit page (create flow, then per-field auto-save). */
  function handleAddRule() {
    create.mutate(
      {
        name: "New rule",
        conditions: emptyConditionTree(),
      },
      {
        onSuccess: (rule) => {
          if (rule.slug) {
            void navigate({
              to: "/card-display-rules/$ruleSlug/edit/general",
              params: {
                ruleSlug: rule.slug,
              },
            });
          }
        },
      },
    );
  }

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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inspect a bookmark</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDisplayRuleInspector />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Rules change how bookmark cards display based on their category, media type, website, tags, and
        more. Higher rules win; each card falls back to the Default rule at the bottom.
      </p>

      {isLoading
        ? <p className="text-sm text-muted-foreground">Loading…</p>
        : null}

      {!isLoading && orderedRules.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            No rules yet. Add one to override how matching bookmark cards display.
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

      <Button
        type="button"
        variant="outline"
        disabled={create.isPending}
        onClick={handleAddRule}
      >
        <Plus className="mr-2 size-4" />
        Add rule
      </Button>

      {defaultRule
        ? (
          <div className="space-y-3 pt-2">
            <CardDisplayRuleCard rule={defaultRule} />
          </div>
        )
        : null}
    </div>
  );
}
