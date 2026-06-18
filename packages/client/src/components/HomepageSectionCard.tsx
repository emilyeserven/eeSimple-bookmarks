import type { HomepageSection, HomepageSectionImageLayout } from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, EyeOff, GripVertical, Pencil } from "lucide-react";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { conditionsBreakdown, conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { HomepageSectionForm } from "./HomepageSectionForm";
import { SectionDisplayControls } from "./SectionDisplayControls";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface HomepageSectionCardProps {
  section: HomepageSection;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

function displayPreview(section: HomepageSection): string {
  const parts = [
    `${section.columns} ${section.columns === 1 ? "column" : "columns"}`,
    section.imageMode ? "Natural" : "Cropped",
  ];
  if (section.columns === 2) parts.push(section.imageLayout === "side" ? "Side" : "Above");
  return parts.join(" · ");
}

export function HomepageSectionCard({
  section, dragHandleProps, isDragging,
}: HomepageSectionCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const update = useUpdateHomepageSection();
  const remove = useDeleteHomepageSection();

  const breakdown = conditionsBreakdown(section.conditions);

  function startEditing() {
    setEditing(true);
    setOpen(true);
  }

  function patchDisplay(input: {
    columns?: number;
    imageMode?: boolean;
    imageLayout?: HomepageSectionImageLayout;
  }) {
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
              onDelete={() => {
                if (confirm(`Delete section "${section.title}"?`)) {
                  remove.mutate(section.id);
                }
              }}
              isDeleting={remove.isPending}
            />
          )
          : (
            <>
              {section.description
                ? <p className="text-sm text-muted-foreground">{section.description}</p>
                : null}

              <CollapsibleFormSection
                title="Display"
                description="How this section's bookmarks are laid out on the homepage."
                preview={displayPreview(section)}
              >
                <SectionDisplayControls
                  idPrefix={`view-${section.id}`}
                  columns={section.columns}
                  imageMode={section.imageMode}
                  imageLayout={section.imageLayout}
                  onColumnsChange={columns => patchDisplay({
                    columns,
                  })}
                  onImageModeChange={imageMode => patchDisplay({
                    imageMode,
                  })}
                  onImageLayoutChange={imageLayout => patchDisplay({
                    imageLayout,
                  })}
                />
              </CollapsibleFormSection>

              <Separator />

              <CollapsibleFormSection
                title="Filter"
                description="The bookmarks shown in this section — use Edit to change them."
                preview={conditionsSummaryLabel(section.conditions)}
              >
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
              </CollapsibleFormSection>
            </>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
