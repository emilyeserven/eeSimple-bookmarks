import type { InboxItem } from "@eesimple/types";

import { useMemo, useState } from "react";

import { normalizeDomain } from "@eesimple/types";
import { ChevronDown } from "lucide-react";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddPublisherModal } from "./AddPublisherModal";
import { Combobox } from "./Combobox";
import { MultiCombobox } from "./MultiCombobox";
import { TagPicker } from "./TagPicker";
import { useAuthors } from "../hooks/useAuthors";
import { useCategories } from "../hooks/useCategories";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { usePublishers } from "../hooks/usePublishers";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "../lib/comboboxOptions";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

interface ImportItemAdvancedEditProps {
  item: InboxItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | undefined;
  mediaTypeId: string | undefined;
  tagIds: string[];
  authorIds: string[];
  publisherId: string | undefined;
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onTagsChange: (ids: string[]) => void;
  onAuthorsChange: (ids: string[]) => void;
  onPublisherChange: (id: string | undefined) => void;
}

/**
 * "Advanced" collapsible for a single pending inbox item. Lets users pre-set the taxonomy fields
 * that will be applied when the item is approved — values live in local state (in the parent
 * ReviewRow) and are merged into the preFill sent to the approve endpoint.
 *
 * `open`/`onOpenChange` are controlled by the parent so the mobile swipe gesture can be disabled
 * while the collapsible is open.
 */
export function ImportItemAdvancedEdit({
  item,
  open,
  onOpenChange,
  categoryId,
  mediaTypeId,
  tagIds,
  authorIds,
  publisherId,
  onCategoryChange,
  onMediaTypeChange,
  onTagsChange,
  onAuthorsChange,
  onPublisherChange,
}: ImportItemAdvancedEditProps) {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
  const [addPublisherOpen, setAddPublisherOpen] = useState(false);
  const [addAuthorOpen, setAddAuthorOpen] = useState(false);

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: authors = [],
  } = useAuthors();
  const {
    data: publishers = [],
  } = usePublishers();
  const {
    data: websites = [],
  } = useWebsites();

  const urlDomain = useMemo(() => {
    try {
      return normalizeDomain(new URL(item.url ?? "").hostname);
    }
    catch {
      return null;
    }
  }, [item.url]);

  const matchedWebsite = urlDomain ? websites.find(w => w.domain === urlDomain) : null;
  const isYouTube = urlDomain === "youtube.com" || urlDomain === "youtu.be";

  function handleTagToggle(id: string) {
    const next = tagIds.includes(id)
      ? tagIds.filter(t => t !== id)
      : [...tagIds, id];
    onTagsChange(next);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
        >
          <ChevronDown
            className={`
              size-3 transition-transform
              ${open ? "rotate-180" : ""}
            `}
          />
          Advanced
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Combobox
            options={iconComboboxOptions(categories)}
            value={categoryId}
            onValueChange={onCategoryChange}
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            createOption={{
              label: "Create category",
              onSelect: () => setAddCategoryOpen(true),
            }}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Media type</Label>
          <Combobox
            options={mediaTypeTreeComboboxOptions(mediaTypeTree)}
            value={mediaTypeId}
            onValueChange={onMediaTypeChange}
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            createOption={{
              label: "Create media type",
              onSelect: () => setAddMediaTypeOpen(true),
            }}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tags</Label>
          <TagPicker
            tree={tagTree}
            selectedIds={tagIds}
            onToggle={handleTagToggle}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Authors</Label>
          <MultiCombobox
            options={authors.map(a => ({
              value: a.id,
              label: a.name,
            }))}
            values={authorIds}
            onValuesChange={onAuthorsChange}
            placeholder="Select authors…"
            searchPlaceholder="Search authors…"
            emptyText="No authors found."
            createOption={{
              label: "Create author",
              onSelect: () => setAddAuthorOpen(true),
            }}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Publisher</Label>
          <Combobox
            options={publishers.map(p => ({
              value: p.id,
              label: p.name,
            }))}
            value={publisherId}
            onValueChange={onPublisherChange}
            placeholder="No publisher"
            searchPlaceholder="Search publishers…"
            emptyText="No publishers found."
            createOption={{
              label: "Create publisher",
              onSelect: () => setAddPublisherOpen(true),
            }}
          />
        </div>

        {(matchedWebsite || isYouTube) && (
          <div
            className="
              flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground
            "
          >
            {matchedWebsite && (
              <span>
                Website:
                {" "}
                <span className="font-medium">{matchedWebsite.siteName}</span>
              </span>
            )}
            {isYouTube && <span>YouTube video</span>}
          </div>
        )}
      </CollapsibleContent>

      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={category => onCategoryChange(category.id)}
      />
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={mediaType => onMediaTypeChange(mediaType.id)}
      />
      <AddAuthorModal
        open={addAuthorOpen}
        onOpenChange={setAddAuthorOpen}
        onCreated={author => onAuthorsChange([...authorIds, author.id])}
      />
      <AddPublisherModal
        open={addPublisherOpen}
        onOpenChange={setAddPublisherOpen}
        onCreated={publisher => onPublisherChange(publisher.id)}
      />
    </Collapsible>
  );
}
