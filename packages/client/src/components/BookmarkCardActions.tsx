import type { Bookmark, BookmarkTag, Category, CustomProperty, MediaType } from "@eesimple/types";

import { ExternalLink, MoreVertical } from "lucide-react";

import { BookmarkCardMenu } from "./BookmarkCardMenu";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** No-op fallback for the optional "More" menu handlers when a surface doesn't wire them. */
const noop = (): void => undefined;

/** The "open URL in a new tab" action button — a placeable card field and an image-corner overlay. */
export function BookmarkExternalLinkButton({
  url,
}: { url: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open URL in new tab"
      >
        <ExternalLink className="size-4" />
      </a>
    </Button>
  );
}

interface BookmarkMoreMenuProps {
  bookmark: Bookmark;
  editableProperties?: CustomProperty[];
  editableTags?: BookmarkTag[];
  editableCategories?: Category[];
  editableMediaTypes?: MediaType[];
  autoImagePending?: boolean;
  onAutoImage?: () => void;
  onSaveNumber?: (propertyId: string, value: number) => void;
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
  onSaveDateTime?: (propertyId: string, value: string) => void;
  onSaveChoices?: (propertyId: string, values: string[]) => void;
  onSaveTags?: (tagIds: string[]) => void;
  onSaveCategory?: (categoryId: string) => void;
  onSaveMediaType?: (mediaTypeId: string | null) => void;
  onDelete?: (id: string) => void;
}

/** The "More options" menu (trigger + {@link BookmarkCardMenu}) — a placeable card field and overlay. */
export function BookmarkMoreMenu({
  bookmark, editableProperties = [], editableTags = [], editableCategories = [],
  editableMediaTypes = [], autoImagePending = false, onAutoImage,
  onSaveNumber, onSaveBoolean, onSaveDateTime, onSaveChoices, onSaveTags,
  onSaveCategory, onSaveMediaType, onDelete,
}: BookmarkMoreMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="More options"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <BookmarkCardMenu
        bookmark={bookmark}
        editableProperties={editableProperties}
        editableTags={editableTags}
        editableCategories={editableCategories}
        editableMediaTypes={editableMediaTypes}
        autoImagePending={autoImagePending}
        onAutoImage={onAutoImage ?? noop}
        onSaveNumber={onSaveNumber ?? noop}
        onSaveBoolean={onSaveBoolean ?? noop}
        onSaveDateTime={onSaveDateTime ?? noop}
        onSaveChoices={onSaveChoices ?? noop}
        onSaveTags={onSaveTags ?? noop}
        onSaveCategory={onSaveCategory ?? noop}
        onSaveMediaType={onSaveMediaType ?? noop}
        onDelete={onDelete}
      />
    </DropdownMenu>
  );
}
