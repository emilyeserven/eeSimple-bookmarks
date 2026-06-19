import type { Bookmark, CustomProperty } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical } from "lucide-react";

import { BookmarkCardMenu } from "./BookmarkCardMenu";
import { useViewPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface BookmarkCardHeaderProps {
  bookmark: Bookmark;
  editableProperties: CustomProperty[];
  autoImagePending: boolean;
  onAutoImage: () => void;
  onSaveNumber: (propertyId: string, value: number) => void;
  onSaveBoolean: (propertyId: string, value: boolean) => void;
  onSaveDateTime: (propertyId: string, value: string) => void;
  onDelete?: (id: string) => void;
}

/** Bookmark card header: title link, open-URL button, and the "More" dropdown menu. */
export function BookmarkCardHeader({
  bookmark, editableProperties, autoImagePending, onAutoImage,
  onSaveNumber, onSaveBoolean, onSaveDateTime, onDelete,
}: BookmarkCardHeaderProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-semibold">
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId: bookmark.id,
            }}
            title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "bookmark", bookmark.id)}
            className="
              wrap-break-word text-primary
              hover:underline
            "
          >
            {bookmark.title}
          </Link>
        </h3>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          asChild
        >
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open URL in new tab"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
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
            autoImagePending={autoImagePending}
            onAutoImage={onAutoImage}
            onSaveNumber={onSaveNumber}
            onSaveBoolean={onSaveBoolean}
            onSaveDateTime={onSaveDateTime}
            onDelete={onDelete}
          />
        </DropdownMenu>
      </div>
    </div>
  );
}
