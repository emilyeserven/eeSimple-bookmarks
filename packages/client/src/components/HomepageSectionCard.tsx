import type { HomepageSection, UpdateHomepageSectionInput } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { ChevronDown, EyeOff, GripVertical, Pencil } from "lucide-react";

import { HomepageSectionForm } from "./HomepageSectionForm";
import { HomepageSectionView } from "./HomepageSectionView";
import {
  useDeleteHomepageSection,
  useUpdateHomepageSection,
} from "../hooks/useHomepageSections";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface HomepageSectionCardProps {
  section: HomepageSection;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

type SectionFormValues = Parameters<Parameters<typeof HomepageSectionForm>[0]["onChange"] & {}>[0];

const AUTOSAVE_DELAY_MS = 800;

export function HomepageSectionCard({
  section, dragHandleProps, isDragging,
}: HomepageSectionCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const update = useUpdateHomepageSection();
  const remove = useDeleteHomepageSection();

  const latestValues = useRef<SectionFormValues | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function startEditing() {
    setEditing(true);
    setOpen(true);
  }

  function handleFieldChange(values: SectionFormValues) {
    latestValues.current = values;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!latestValues.current) return;
      update.mutate({
        id: section.id,
        input: latestValues.current,
      });
    }, AUTOSAVE_DELAY_MS);
  }

  function patchDisplay(input: UpdateHomepageSectionInput) {
    update.mutate({
      id: section.id,
      input,
    });
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-xl border bg-card transition-shadow",
        isDragging && "shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          className="
            cursor-grab touch-none text-muted-foreground
            hover:text-foreground
          "
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="flex-1 text-base font-semibold">
          {section.title}
          {section.hideIfEmpty && (
            <EyeOff
              className="ml-1.5 inline size-3.5 text-muted-foreground"
              aria-label="Hides when empty"
            />
          )}
        </span>
        {!editing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Edit section"
            onClick={startEditing}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={open ? "Collapse section" : "Expand section"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4 px-4 pb-4">
        {editing
          ? (
            <HomepageSectionForm
              section={section}
              onChange={handleFieldChange}
              onCancel={() => setEditing(false)}
              onDelete={() => {
                if (confirm(`Delete section "${section.title}"?`)) {
                  remove.mutate(section.id);
                }
              }}
              isDeleting={remove.isPending}
            />
          )
          : (
            <HomepageSectionView
              section={section}
              onPatchDisplay={patchDisplay}
            />
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
