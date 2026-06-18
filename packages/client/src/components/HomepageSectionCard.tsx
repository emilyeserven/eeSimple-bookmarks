import type { HomepageSection } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";

import { ColumnsSwitcher } from "./ColumnsSwitcher";
import { conditionsBreakdown, conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { HomepageSectionForm } from "./HomepageSectionForm";
import { ImageLayoutSwitcher } from "./ImageLayoutSwitcher";
import { ImageModeSwitcher } from "./ImageModeSwitcher";
import {
  useDeleteHomepageSection,
  useUpdateHomepageSection,
} from "../hooks/useHomepageSections";
import { useBookmarkColumns, useHomepageSectionImageLayout } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

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

export function HomepageSectionCard({
  section, dragHandleProps, isDragging,
}: HomepageSectionCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const update = useUpdateHomepageSection();
  const remove = useDeleteHomepageSection();
  const columns = useBookmarkColumns(section.id);
  const imageLayout = useHomepageSectionImageLayout(section.id);
  const setHomepageSectionImageLayout = useUiStore(state => state.setHomepageSectionImageLayout);

  const breakdown = conditionsBreakdown(section.conditions);

  function startEditing() {
    setEditing(true);
    setOpen(true);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "bg-card transition-shadow",
        isDragging && "rounded-xl border shadow-lg",
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Edit section"
          onClick={() => (editing ? setEditing(false) : startEditing())}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="
            size-8 text-destructive
            hover:text-destructive
          "
          aria-label="Delete section"
          onClick={() => {
            if (confirm(`Delete section "${section.title}"?`)) {
              remove.mutate(section.id);
            }
          }}
          disabled={remove.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
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

      <CollapsibleContent className="space-y-3 px-4 pb-4">
        {editing
          ? (
            <HomepageSectionForm
              section={section}
              isPending={update.isPending}
              onSave={(values) => {
                update.mutate(
                  {
                    id: section.id,
                    input: values,
                  },
                  {
                    onSuccess: () => setEditing(false),
                  },
                );
              }}
              onCancel={() => setEditing(false)}
            />
          )
          : (
            <>
              {section.description
                ? <p className="text-sm text-muted-foreground">{section.description}</p>
                : null}

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground">Display</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <ColumnsSwitcher pageKey={section.id} />
                  {columns === 2 && (
                    <ImageLayoutSwitcher
                      layout={imageLayout}
                      onLayoutChange={layout => setHomepageSectionImageLayout(section.id, layout)}
                    />
                  )}
                  <ImageModeSwitcher pageKey={section.id} />
                </div>
              </div>

              <Collapsible
                open={filterOpen}
                onOpenChange={setFilterOpen}
                className="rounded-md border"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="
                      flex w-full items-center justify-between gap-2 p-3
                      text-left text-sm font-medium
                    "
                  >
                    <span>
                      Filter
                      <span className="ml-2 font-normal text-muted-foreground">
                        {conditionsSummaryLabel(section.conditions)}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 opacity-60 transition-transform",
                        filterOpen && "rotate-180",
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t p-3">
                  {breakdown.length === 0
                    ? (
                      <p className="text-sm text-muted-foreground">
                        No conditions yet — use Edit to choose which bookmarks appear here.
                      </p>
                    )
                    : (
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {breakdown.map(line => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
