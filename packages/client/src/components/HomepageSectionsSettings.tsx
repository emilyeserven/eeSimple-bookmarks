import type { DragEndEvent } from "@dnd-kit/core";
import type { HomepageSection } from "@eesimple/types";

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
import { Plus } from "lucide-react";

import { HomepageSectionCard } from "./HomepageSectionCard";
import { HomepageSectionForm } from "./HomepageSectionForm";
import {
  useCreateHomepageSection,
  useHomepageSections,
  useOptimisticReorder,
  useReorderHomepageSections,
} from "../hooks/useHomepageSections";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Sortable wrapper for a single section card in the settings list. */
function SortableSectionCard({
  section,
}: { section: HomepageSection }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: section.id,
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
      <HomepageSectionCard
        section={section}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        isDragging={isDragging}
      />
    </div>
  );
}

/** The main settings component — a drag-sortable list of homepage section cards. */
export function HomepageSectionsSettings() {
  const {
    data: serverSections, isLoading,
  } = useHomepageSections();
  const [localSections, setLocalSections] = useState<HomepageSection[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const create = useCreateHomepageSection();
  const reorder = useReorderHomepageSections();
  const setOptimisticOrder = useOptimisticReorder();

  // Keep local order in sync with server data.
  useEffect(() => {
    if (serverSections) setLocalSections(serverSections);
  }, [serverSections]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {
      active, over,
    } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = localSections.findIndex(s => s.id === active.id);
    const newIndex = localSections.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(localSections, oldIndex, newIndex);
    setLocalSections(reordered);
    setOptimisticOrder(reordered);
    reorder.mutate(reordered.map(s => s.id));
  }

  const activeSection = activeId ? localSections.find(s => s.id === activeId) : null;

  return (
    <div className="space-y-4">
      {isLoading
        ? <p className="text-sm text-muted-foreground">Loading…</p>
        : null}

      {!isLoading && localSections.length === 0 && !addingNew
        ? (
          <p className="text-sm text-muted-foreground">
            No sections yet. Add one below to start building your homepage.
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
          items={localSections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localSections.map(section => (
              <SortableSectionCard
                key={section.id}
                section={section}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSection
            ? (
              <HomepageSectionCard
                section={activeSection}
                isDragging
              />
            )
            : null}
        </DragOverlay>
      </DndContext>

      {addingNew
        ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">New section</CardTitle>
            </CardHeader>
            <CardContent>
              <HomepageSectionForm
                isPending={create.isPending}
                onSave={(values) => {
                  create.mutate(
                    {
                      title: values.title,
                      description: values.description,
                      conditions: values.conditions,
                    },
                    {
                      onSuccess: () => setAddingNew(false),
                    },
                  );
                }}
                onCancel={() => setAddingNew(false)}
              />
            </CardContent>
          </Card>
        )
        : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="mr-2 size-4" />
            Add section
          </Button>
        )}
    </div>
  );
}
