import { useState } from "react";

import { Folder, FolderOpen } from "lucide-react";

import { useCategories } from "../hooks/useCategories";
import { useTagCategories } from "../hooks/useTags";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagCategoriesPopoverProps {
  tagId: string;
  tagName: string;
}

/** Folder popover listing the categories a root tag is scoped to (or "All categories" when none). */
export function TagCategoriesPopover({
  tagId, tagName,
}: TagCategoriesPopoverProps) {
  const [open, setOpen] = useState(false);
  const {
    data: categoryIds, isLoading,
  } = useTagCategories(tagId, {
    enabled: open,
  });
  const {
    data: allCategories,
  } = useCategories();

  const assignedCategories = categoryIds && allCategories && categoryIds.length > 0
    ? allCategories.filter(c => categoryIds.includes(c.id))
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Categories for ${tagName}`}
          onClick={e => e.stopPropagation()}
          className="
            text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          {open
            ? <FolderOpen className="size-4 shrink-0" />
            : <Folder className="size-4 shrink-0" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3"
        align="start"
      >
        <p
          className="
            mb-2 text-xs font-semibold tracking-wide text-muted-foreground
            uppercase
          "
        >
          Categories
        </p>
        {isLoading || categoryIds === undefined
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : categoryIds.length === 0
            ? <p className="text-sm text-muted-foreground italic">All categories</p>
            : (
              <ul className="space-y-1">
                {(assignedCategories ?? []).map(c => (
                  <li
                    key={c.id}
                    className="text-sm"
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
      </PopoverContent>
    </Popover>
  );
}
