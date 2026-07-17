import type { AddChild } from "@/routes/-appHeaderData";
import type { MouseEvent as ReactMouseEvent } from "react";

import { useState } from "react";

import { Bookmark, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddChildModal } from "@/components/AddChildModal";
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
  /**
   * When set (hierarchy-taxonomy term/tag/media-type listing pages), fold a "New sub-…" option into
   * this control instead of rendering a second standalone header button. The modal is owned here.
   */
  addChild?: AddChild;
}

function addChildLabel(kind: NonNullable<AddChild>["kind"], t: (key: string) => string): string {
  if (kind === "tag") return t("New sub-tag");
  if (kind === "mediaType") return t("New sub-type");
  return t("New sub-term");
}

/** The add-child option is disabled until its fixed-parent (and, for a custom term, taxonomy) ids resolve. */
function addChildDisabled(addChild: NonNullable<AddChild>): boolean {
  return addChild.kind === "taxonomyTerm"
    ? !addChild.parentId || !addChild.taxonomyId
    : !addChild.parentId;
}

/**
 * The header Plus control for a listing page. With a single create option it renders a plain Plus
 * button (preserving the pre-existing single-button UX); with two or more of "Add bookmark", the
 * page's own entity create, and a "New sub-…" child create, it renders a Plus button opening a
 * dropdown of them. The Add Bookmark action opens the app-level modal via `openAddBookmarkModal`; the
 * add-child modal is owned here so hierarchy-taxonomy term pages don't render a second header button.
 */
export function ListingCreateButton({
  addBookmark, createAction, createLabel, addChild,
}: ListingCreateOptions) {
  const {
    t,
  } = useTranslation();
  const openAddBookmarkModal = useUiStore(state => state.openAddBookmarkModal);
  const [childOpen, setChildOpen] = useState(false);

  const hasBookmark = addBookmark != null;
  const hasCreate = createAction != null;
  const hasChild = addChild != null;
  const optionCount = (hasBookmark ? 1 : 0) + (hasCreate ? 1 : 0) + (hasChild ? 1 : 0);

  if (optionCount === 0) return null;

  const childLabel = addChild ? addChildLabel(addChild.kind, t) : "";
  const childDisabled = addChild ? addChildDisabled(addChild) : false;

  // Exactly one option → a plain Plus button, keeping today's single-button behavior.
  if (optionCount === 1) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={hasBookmark ? t("Add bookmark") : hasCreate ? createLabel ?? t("New") : childLabel}
          disabled={hasChild ? childDisabled : undefined}
          onClick={hasBookmark
            ? () => openAddBookmarkModal(addBookmark?.categoryId)
            : hasCreate
              ? createAction
              : () => setChildOpen(true)}
        >
          <Plus className="size-4" />
        </Button>
        {addChild && (
          <AddChildModal
            {...addChild}
            open={childOpen}
            onOpenChange={setChildOpen}
          />
        )}
      </>
    );
  }

  // Two or more options → a Plus button that opens a dropdown listing each addable item.
  return (
    <>
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
          {hasBookmark && (
            <DropdownMenuItem onSelect={() => openAddBookmarkModal(addBookmark?.categoryId)}>
              <Bookmark className="size-4" />
              {t("Add bookmark")}
            </DropdownMenuItem>
          )}
          {hasCreate && (
            <DropdownMenuItem onSelect={() => createAction?.()}>
              <Plus className="size-4" />
              {createLabel ?? t("New")}
            </DropdownMenuItem>
          )}
          {hasChild && (
            <DropdownMenuItem
              disabled={childDisabled}
              onSelect={() => setChildOpen(true)}
            >
              <Plus className="size-4" />
              {childLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {addChild && (
        <AddChildModal
          {...addChild}
          open={childOpen}
          onOpenChange={setChildOpen}
        />
      )}
    </>
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
