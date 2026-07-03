import type { CreateKind } from "./commandPaletteModals";
import type { TaxonomyMode } from "./commandPaletteSubPalettes";
import type { SettingsPage } from "@/lib/settingsPages";

import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, RefreshCw, StarIcon } from "lucide-react";

import { AddChildModal } from "./AddChildModal";
import { BookmarkViewPageCommandGroup } from "./BookmarkViewPageCommandGroup";
import { CommandPaletteModals } from "./commandPaletteModals";
import { CommandPaletteNavGroups } from "./CommandPaletteNavGroups";
import {
  BookmarkTaxonomiesGroup,
  CardDisplayRulesGroup,
} from "./commandPaletteSubPalettes";
import { CommandPaletteTaxonomyModes } from "./CommandPaletteTaxonomyModes";
import { EntityCommandGroup } from "./EntityCommandGroup";
import { ListingPageCommandGroup } from "./ListingPageCommandGroup";
import { useCommandPaletteData } from "./useCommandPaletteData";
import {
  paletteInputPlaceholder,
  useAddBookmarkDraft,
  useCommandPaletteShell,
  useCommandPaletteTaxonomyState,
  useCreateModalState,
} from "./useCommandPaletteState";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsFavorite } from "@/hooks/useSettingsFavorite";
import { useUiStore } from "@/stores/uiStore";

/**
 * Favorite/unfavorite the current settings page — the palette twin of the header star button
 * (`settingsFavoriteAction`). Mounted only when a settings page matches, so `useSettingsFavorite`'s
 * non-null `page` requirement holds.
 */
function SettingsFavoriteCommandItem({
  page,
  onDone,
}: {
  page: SettingsPage;
  onDone: () => void;
}) {
  const {
    isFavorited, toggle,
  } = useSettingsFavorite(page);
  const label = isFavorited ? "Unfavorite This Page" : "Favorite This Page";
  return (
    <CommandItem
      value={label}
      onSelect={() => {
        toggle();
        onDone();
      }}
    >
      <StarIcon className={isFavorited ? "fill-current" : undefined} />
      {label}
    </CommandItem>
  );
}

/**
 * Palette mirror of the header "Sync from source" button (CLAUDE.md: the palette must mirror every
 * header toolbar action). Opens the one store-driven Sync modal; gated at the call site on a
 * registered `syncProvider`, so it only appears on an entity's edit surface.
 */
function SyncFromSourceCommandItem({
  entityLabel,
  onDone,
}: {
  entityLabel: string;
  onDone: () => void;
}) {
  const setSyncModalOpen = useUiStore(state => state.setSyncModalOpen);
  return (
    <CommandItem
      value="Sync from source"
      onSelect={() => {
        setSyncModalOpen(true);
        onDone();
      }}
    >
      <RefreshCw />
      Sync
      {" "}
      {entityLabel}
      {" "}
      from source
    </CommandItem>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommandPalette() {
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

  // The header add-child modal, opened from the matched entity's "New sub-tag/sub-type" item.
  const [addChild, setAddChild] = useState<{ kind: "tag" | "mediaType";
    parentId: string; } | null>(null);

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
          to: "/bookmarks/$bookmarkId/edit/properties",
          params: {
            bookmarkId,
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
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <Command>
            <CommandInput
              placeholder={paletteInputPlaceholder(taxonomy, customProperties)}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>No results found.</CommandEmpty>

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
                <>
                  {/* Hovered card's quick-edit commands float to the top of the palette. */}
                  {bookmarkFromHover && bookmarkTaxonomiesGroup}
                  {bookmarkFromHover && cardDisplayRulesGroup}

                  {looksLikeUrl && (
                    <>
                      <CommandGroup heading="Quick Add">
                        <CommandItem
                          value={inputValue}
                          onSelect={() => handleAddBookmark(inputValue)}
                        >
                          <PlusIcon />
                          <span>
                            Add bookmark:
                            {" "}
                            <span className="text-muted-foreground">{inputValue}</span>
                          </span>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  <ListingPageCommandGroup
                    listingCtx={listingCtx}
                    onClose={handleClose}
                  />

                  {syncProvider && (
                    <>
                      <CommandGroup heading="Current Page">
                        <SyncFromSourceCommandItem
                          entityLabel={syncProvider.entityLabel}
                          onDone={handleClose}
                        />
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {isBookmarkViewPage && bookmarkId && bookmark && (
                    <BookmarkViewPageCommandGroup
                      bookmarkId={bookmarkId}
                      detailLayout={detailLayout}
                      setDetailLayout={setDetailLayout}
                      onClose={handleClose}
                    />
                  )}

                  {/* On a bookmark detail page the same group keeps its in-page position. */}
                  {!bookmarkFromHover && bookmarkTaxonomiesGroup}
                  {!bookmarkFromHover && cardDisplayRulesGroup}

                  {settingsPage && (
                    <>
                      <CommandGroup heading="Current Page">
                        <SettingsFavoriteCommandItem
                          page={settingsPage}
                          onDone={handleClose}
                        />
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {entityCtx.matched && (
                    <>
                      <EntityCommandGroup
                        matched={entityCtx.matched}
                        onNavigate={handleSelect}
                        onEnterChoiceField={(field) => {
                          taxonomy.enterEntityChoiceMode(field);
                          setInputValue("");
                        }}
                        onAddChild={(kind, parentId) => {
                          handleClose();
                          setAddChild({
                            kind,
                            parentId,
                          });
                        }}
                        onClose={handleClose}
                      />
                      <CommandSeparator />
                    </>
                  )}

                  <CommandPaletteNavGroups
                    inputValue={inputValue}
                    bookmarks={bookmarks}
                    onSelect={handleSelect}
                    onAddBookmark={() => handleAddBookmark()}
                    onCreate={handleCreate}
                  />
                </>
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
