import type { CreateKind } from "./commandPaletteModals";
import type { TaxonomyMode } from "./commandPaletteSubPalettes";

import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddChildModal } from "./AddChildModal";
import { CommandPaletteDefaultView } from "./CommandPaletteDefaultView";
import { CommandPaletteModals } from "./commandPaletteModals";
import {
  BookmarkTaxonomiesGroup,
  CardDisplayRulesGroup,
} from "./commandPaletteSubPalettes";
import { CommandPaletteTaxonomyModes } from "./CommandPaletteTaxonomyModes";
import { useCommandPaletteData } from "./useCommandPaletteData";
import {
  paletteInputPlaceholder,
  useAddBookmarkDraft,
  useAddChildModalState,
  useCommandPaletteShell,
  useCommandPaletteTaxonomyState,
  useCreateModalState,
} from "./useCommandPaletteState";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/stores/uiStore";

// ─── Main component ───────────────────────────────────────────────────────────

export function CommandPalette() {
  const {
    t,
  } = useTranslation();
  const {
    open, setOpen, inputValue, setInputValue,
  } = useCommandPaletteShell();
  const {
    addBookmarkOpen, setAddBookmarkOpen, pendingUrl, setPendingUrl,
  } = useAddBookmarkDraft();
  const {
    createKind, assignOnCreate, openCreate, openCreateAndAssign, closeCreate,
  } = useCreateModalState();
  const taxonomy = useCommandPaletteTaxonomyState();
  const navigate = useNavigate();

  // Snapshot the hovered card at open time: opening the dialog covers the page and can fire the
  // card's mouseleave, so reading the live value would null it out just as the palette appears.
  const hoveredBookmarkId = useUiStore(state => state.hoveredBookmarkId);
  const syncProvider = useUiStore(state => state.syncProvider);
  const [targetBookmarkId, setTargetBookmarkId] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setTargetBookmarkId(hoveredBookmarkId);
    }
    // Only re-snapshot on the open transition, not on every hover change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const {
    addChild, setAddChild,
  } = useAddChildModalState();

  const {
    bookmarks,
    taxonomyContext,
    detailLayout,
    setDetailLayout,
    listingCtx,
    entityCtx,
    settingsPage,
    matchingCardRules,
  } = useCommandPaletteData(open, targetBookmarkId);

  const {
    bookmarkId,
    isBookmarkViewPage,
    bookmarkFromHover,
    bookmark,
    categories,
    people,
    groups,
    customProperties,
    updateBookmark,
  } = taxonomyContext;

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setInputValue("");
      taxonomy.reset();
    }
  };

  const handleClose = () => handleOpenChange(false);

  const handleSelect = (path: string) => {
    handleClose();
    void navigate({
      to: path,
    });
  };

  const handleAddBookmark = (url = "") => {
    handleClose();
    setPendingUrl(url);
    setAddBookmarkOpen(true);
  };

  const handleCreate = (kind: CreateKind) => {
    handleClose();
    openCreate(kind);
  };

  const handleCreateAndAssign = (kind: CreateKind) => {
    handleClose();
    openCreateAndAssign(kind);
  };

  const handleEnterMode = (mode: TaxonomyMode) => {
    taxonomy.enterMode(mode, bookmark);
    setInputValue("");
  };

  const handleEnterChoicesMode = (propId: string) => {
    taxonomy.enterChoicesMode(
      propId,
      bookmark?.choicesValues.find(v => v.propertyId === propId)?.values ?? [],
    );
    setInputValue("");
  };

  const handleEnterRatingMode = (propId: string) => {
    taxonomy.enterRatingMode(propId);
    setInputValue("");
  };

  const handleExitMode = () => {
    taxonomy.exitMode();
    setInputValue("");
  };

  const looksLikeUrl
    = inputValue.startsWith("http://")
      || inputValue.startsWith("https://")
      || inputValue.startsWith("www.");

  const currentCategoryName = bookmark
    ? (categories.find(c => c.id === bookmark.categoryId)?.name ?? "Default")
    : null;

  const booleanProperties = customProperties.filter(
    p => p.type === "boolean" && p.editableViaCmdk,
  );
  const choicesProperties = customProperties.filter(
    p => p.type === "choices" && p.choicesItems.length > 0 && p.editableViaCmdk,
  );
  const ratingProperties = customProperties.filter(
    p => p.type === "ratingScale" && !p.ratingAllowHalf && p.editableViaCmdk,
  );
  const editableProperties = customProperties.filter(
    p => p.editableViaCmdk
      && p.type !== "calculate"
      && p.type !== "boolean"
      && !(p.type === "choices" && p.choicesItems.length > 0)
      && !(p.type === "ratingScale" && !p.ratingAllowHalf),
  );

  const bookmarkTaxonomiesGroup = bookmarkId && bookmark && (
    <BookmarkTaxonomiesGroup
      bookmark={bookmark}
      bookmarkId={bookmarkId}
      isBookmarkViewPage={isBookmarkViewPage}
      currentCategoryName={currentCategoryName}
      people={people}
      groups={groups}
      booleanProperties={booleanProperties}
      choicesProperties={choicesProperties}
      ratingProperties={ratingProperties}
      editableProperties={editableProperties}
      updateBookmark={updateBookmark}
      onEnterMode={handleEnterMode}
      onEnterChoicesMode={handleEnterChoicesMode}
      onEnterRatingMode={handleEnterRatingMode}
      onNavigateProperties={() => {
        void navigate({
          to: "/bookmarks/$bookmarkId/edit",
          params: {
            bookmarkId,
          },
          search: {
            tab: "properties",
          },
        });
        handleClose();
      }}
      onClose={handleClose}
    />
  );

  // Empty (no bookmark / no matches) renders nothing — CardDisplayRulesGroup returns null — so no
  // extra guard is needed at the call sites beyond the hover/detail position check.
  const cardDisplayRulesGroup = (
    <CardDisplayRulesGroup
      rules={matchingCardRules}
      onSelect={(slug) => {
        void navigate({
          to: "/card-display-rules/$ruleSlug",
          params: {
            ruleSlug: slug,
          },
        });
        handleClose();
      }}
    />
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">{t("Command palette")}</DialogTitle>
          <Command>
            <CommandInput
              placeholder={paletteInputPlaceholder(taxonomy, customProperties)}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>{t("No results found.")}</CommandEmpty>

              <CommandPaletteTaxonomyModes
                taxonomy={taxonomy}
                taxonomyContext={taxonomyContext}
                entityCtx={entityCtx}
                onExitMode={handleExitMode}
                onClose={handleClose}
                onCreateAndAssign={handleCreateAndAssign}
              />

              {/* Default palette view */}
              {taxonomy.taxonomyMode === null && (
                <CommandPaletteDefaultView
                  bookmarkFromHover={bookmarkFromHover}
                  bookmarkTaxonomiesGroup={bookmarkTaxonomiesGroup}
                  cardDisplayRulesGroup={cardDisplayRulesGroup}
                  looksLikeUrl={looksLikeUrl}
                  inputValue={inputValue}
                  onAddBookmark={handleAddBookmark}
                  listingCtx={listingCtx}
                  onClose={handleClose}
                  syncProvider={syncProvider}
                  isBookmarkViewPage={isBookmarkViewPage}
                  bookmarkId={bookmarkId}
                  bookmark={bookmark}
                  detailLayout={detailLayout}
                  setDetailLayout={setDetailLayout}
                  settingsPage={settingsPage}
                  entityCtx={entityCtx}
                  taxonomy={taxonomy}
                  setInputValue={setInputValue}
                  onSelect={handleSelect}
                  onAddChild={(kind, parentId) => {
                    handleClose();
                    setAddChild({
                      kind,
                      parentId,
                    });
                  }}
                  bookmarks={bookmarks}
                  onCreate={handleCreate}
                />
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <CommandPaletteModals
        addBookmarkOpen={addBookmarkOpen}
        setAddBookmarkOpen={setAddBookmarkOpen}
        pendingUrl={pendingUrl}
        createKind={createKind}
        assignOnCreate={assignOnCreate}
        closeCreate={closeCreate}
        bookmarkId={bookmarkId}
        bookmark={bookmark}
        updateBookmark={updateBookmark}
      />

      {addChild && (
        <AddChildModal
          kind={addChild.kind}
          parentId={addChild.parentId}
          open
          onOpenChange={openState => !openState && setAddChild(null)}
        />
      )}
    </>
  );
}
