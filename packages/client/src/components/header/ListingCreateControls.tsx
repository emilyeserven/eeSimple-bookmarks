import type { MouseEvent as ReactMouseEvent } from "react";

import { Bookmark, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/uiStore";

export interface ListingCreateOptions {
  /** When set, offer "Add bookmark" (with an optional locked category). */
  addBookmark?: { categoryId?: string };
  /** The page's own entity-create handler, if any (e.g. open the New Category modal). */
  createAction?: (event?: ReactMouseEvent) => void;
  /** Label for the entity-create option (e.g. "New category"). Defaults to "New". */
  createLabel?: string;
}

/**
 * The header Plus control for a listing page. With a single create option it renders a plain Plus
 * button (preserving the pre-existing single-button UX); with both "Add bookmark" and the page's own
 * entity create, it renders a Plus button opening a dropdown of the two. The Add Bookmark action
 * opens the app-level modal via `openAddBookmarkModal`.
 */
export function ListingCreateButton({
  addBookmark, createAction, createLabel,
}: ListingCreateOptions) {
  const {
    t,
  } = useTranslation();
  const openAddBookmarkModal = useUiStore(state => state.openAddBookmarkModal);
  const hasBookmark = addBookmark != null;
  const hasCreate = createAction != null;

  if (!hasBookmark && !hasCreate) return null;

  // Exactly one option → a plain Plus button, keeping today's single-button behavior.
  if (hasBookmark !== hasCreate) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={hasBookmark ? t("Add bookmark") : createLabel ?? t("New")}
        onClick={hasBookmark ? () => openAddBookmarkModal(addBookmark?.categoryId) : createAction}
      >
        <Plus className="size-4" />
      </Button>
    );
  }

  // Both options → a Plus button that opens a dropdown listing each addable item.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("New")}
        >
          <Plus className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => openAddBookmarkModal(addBookmark?.categoryId)}>
          <Bookmark className="size-4" />
          {t("Add bookmark")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => createAction?.()}>
          <Plus className="size-4" />
          {createLabel ?? t("New")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The small-screen More-menu rows for the same create options. Rendered inside `HeaderMoreMenu`'s
 * dropdown; the app-level modal (opened via `openAddBookmarkModal`) survives the menu closing.
 */
export function ListingCreateMenuItems({
  addBookmark, createAction, createLabel,
}: ListingCreateOptions) {
  const {
    t,
  } = useTranslation();
  const openAddBookmarkModal = useUiStore(state => state.openAddBookmarkModal);

  return (
    <>
      {addBookmark != null
        ? (
          <DropdownMenuItem onSelect={() => openAddBookmarkModal(addBookmark.categoryId)}>
            <Bookmark className="size-4" />
            {t("Add bookmark")}
          </DropdownMenuItem>
        )
        : null}
      {createAction != null
        ? (
          <DropdownMenuItem onSelect={() => createAction()}>
            <Plus className="size-4" />
            {createLabel ?? t("New")}
          </DropdownMenuItem>
        )
        : null}
    </>
  );
}
