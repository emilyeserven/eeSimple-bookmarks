import type { HomepageSection } from "@eesimple/types";

import { useState } from "react";

import { EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";

import { ColumnsSwitcher } from "./ColumnsSwitcher";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HomepageSectionCardProps {
  section: HomepageSection;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export function HomepageSectionCard({
  section, dragHandleProps, isDragging,
}: HomepageSectionCardProps) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateHomepageSection();
  const remove = useDeleteHomepageSection();
  const columns = useBookmarkColumns(section.id);
  const imageLayout = useHomepageSectionImageLayout(section.id);
  const setHomepageSectionImageLayout = useUiStore(state => state.setHomepageSectionImageLayout);

  const conditionCount = section.conditions.children.length;

  return (
    <Card
      className={`
        transition-shadow
        ${isDragging ? "opacity-80 shadow-lg" : ""}
      `}
    >
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
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
        <CardTitle className="flex-1 text-base">
          {section.title}
          {section.hideIfEmpty && (
            <EyeOff
              className="ml-1.5 inline size-3.5 text-muted-foreground"
              aria-label="Hides when empty"
            />
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <ColumnsSwitcher pageKey={section.id} />
          {columns === 2 && (
            <ImageLayoutSwitcher
              layout={imageLayout}
              onLayoutChange={layout => setHomepageSectionImageLayout(section.id, layout)}
            />
          )}
          <ImageModeSwitcher pageKey={section.id} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Edit section"
            onClick={() => setEditing(e => !e)}
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
        </div>
      </CardHeader>

      {!editing && (
        <CardContent className="pt-0 pb-3">
          {section.description
            ? <p className="text-sm text-muted-foreground">{section.description}</p>
            : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {conditionCount === 0
              ? "No filter conditions — shows nothing"
              : `${conditionCount} filter condition${conditionCount === 1 ? "" : "s"} (${section.conditions.combinator.toUpperCase()})`}
          </p>
        </CardContent>
      )}

      {editing && (
        <CardContent className="pt-0">
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
        </CardContent>
      )}
    </Card>
  );
}
