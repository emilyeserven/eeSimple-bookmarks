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

interface CreateOptionProps extends ListingCreateOptions {
  childLabel: string;
  childDisabled: boolean;
  onChildOpen: () => void;
}

/** Single-option header control: a plain Plus button, preserving today's single-button behavior. */
function SingleCreateButton({
  addBookmark, createAction, createLabel, addChild, childLabel, childDisabled, onChildOpen,
}: CreateOptionProps) {
  const {
    t,
  } = useTranslation();
  const openAddBookmarkModal = useUiStore(state => state.openAddBookmarkModal);
  const hasBookmark = addBookmark != null;
  const hasCreate = createAction != null;
  const ariaLabel = hasBookmark ? t("Add bookmark") : hasCreate ? createLabel ?? t("New") : childLabel;
  const onClick = hasBookmark
    ? () => openAddBookmarkModal(addBookmark?.categoryId)
    : hasCreate
      ? createAction
      : onChildOpen;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      disabled={addChild != null ? childDisabled : undefined}
      onClick={onClick}
    >
      <Plus className="size-4" />
    </Button>
  );
}

/** Multi-option header control: a Plus button opening a dropdown listing each addable item. */
function MultiCreateDropdown({
  addBookmark, createAction, createLabel, addChild, childLabel, childDisabled, onChildOpen,
}: CreateOptionProps) {
  const {
    t,
  } = useTranslation();
  const openAddBookmarkModal = useUiStore(state => state.openAddBookmarkModal);
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
        {addBookmark != null && (
          <DropdownMenuItem onSelect={() => openAddBookmarkModal(addBookmark.categoryId)}>
            <Bookmark className="size-4" />
            {t("Add bookmark")}
          </DropdownMenuItem>
        )}
        {createAction != null && (
          <DropdownMenuItem onSelect={() => createAction()}>
            <Plus className="size-4" />
            {createLabel ?? t("New")}
          </DropdownMenuItem>
        )}
        {addChild != null && (
          <DropdownMenuItem
            disabled={childDisabled}
            onSelect={onChildOpen}
          >
            <Plus className="size-4" />
            {childLabel}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const [childOpen, setChildOpen] = useState(false);

  const optionCount = (addBookmark != null ? 1 : 0) + (createAction != null ? 1 : 0) + (addChild != null ? 1 : 0);
  if (optionCount === 0) return null;

  const optionProps: CreateOptionProps = {
    addBookmark,
    createAction,
    createLabel,
    addChild,
    childLabel: addChild ? addChildLabel(addChild.kind, t) : "",
    childDisabled: addChild ? addChildDisabled(addChild) : false,
    onChildOpen: () => setChildOpen(true),
  };

  return (
    <>
      {optionCount === 1
        ? <SingleCreateButton {...optionProps} />
        : <MultiCreateDropdown {...optionProps} />}
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
