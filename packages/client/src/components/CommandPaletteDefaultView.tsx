import type { CreateKind } from "./commandPaletteModals";
import type { CommandPaletteTaxonomyState } from "./useCommandPaletteState";
import type { useEntityCommandContext } from "./useEntityCommandContext";
import type { useListingPageContext } from "./useListingPageContext";
import type { SettingsPage } from "@/lib/settingsPages";
import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";
import type { Bookmark, BookmarkDetailLayout } from "@eesimple/types";
import type { ReactNode } from "react";

import { PlusIcon, RefreshCw, StarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkViewPageCommandGroup } from "./BookmarkViewPageCommandGroup";
import { CommandPaletteNavGroups } from "./CommandPaletteNavGroups";
import { EntityCommandGroup } from "./EntityCommandGroup";
import { ListingPageCommandGroup } from "./ListingPageCommandGroup";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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
    t,
  } = useTranslation();
  const {
    isFavorited, toggle,
  } = useSettingsFavorite(page);
  const label = isFavorited ? t("Unfavorite This Page") : t("Favorite This Page");
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
  const {
    t,
  } = useTranslation();
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
      {t("Sync {{entity}} from source", {
        entity: entityLabel,
      })}
    </CommandItem>
  );
}

/** The hovered/current bookmark's quick-edit groups, shown only when `show` is true. */
function BookmarkQuickEditGroups({
  show, bookmarkTaxonomiesGroup,
}: {
  show: boolean;
  bookmarkTaxonomiesGroup: ReactNode;
}) {
  if (!show) return null;
  return (
    <>
      {bookmarkTaxonomiesGroup}
    </>
  );
}

/** "Quick Add" group for a URL-looking search term. */
function QuickAddGroup({
  looksLikeUrl, inputValue, onAddBookmark,
}: {
  looksLikeUrl: boolean;
  inputValue: string;
  onAddBookmark: (url: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!looksLikeUrl) return null;
  return (
    <>
      <CommandGroup heading={t("Quick Add")}>
        <CommandItem
          value={inputValue}
          onSelect={() => onAddBookmark(inputValue)}
        >
          <PlusIcon />
          <span>
            {t("Add bookmark:")}
            {" "}
            <span className="text-muted-foreground">{inputValue}</span>
          </span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}

/** "Sync from source" quick-action, shown only while an entity edit form has registered a provider. */
function SyncFromSourceGroup({
  syncProvider, onClose,
}: {
  syncProvider: SyncProvider | null;
  onClose: () => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!syncProvider) return null;
  return (
    <>
      <CommandGroup heading={t("Current Page")}>
        <SyncFromSourceCommandItem
          entityLabel={syncProvider.entityLabel}
          onDone={onClose}
        />
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}

/** The bookmark detail page's "Current Page" actions (edit / detail layout), shown on that page only. */
function BookmarkViewGroup({
  isBookmarkViewPage, bookmarkId, bookmark, detailLayout, setDetailLayout, onClose,
}: {
  isBookmarkViewPage: boolean;
  bookmarkId: string | null;
  bookmark: Bookmark | null | undefined;
  detailLayout: BookmarkDetailLayout;
  setDetailLayout: (layout: BookmarkDetailLayout) => void;
  onClose: () => void;
}) {
  if (!isBookmarkViewPage || !bookmarkId || !bookmark) return null;
  return (
    <BookmarkViewPageCommandGroup
      bookmarkId={bookmarkId}
      detailLayout={detailLayout}
      setDetailLayout={setDetailLayout}
      onClose={onClose}
    />
  );
}

/** Favorite/unfavorite quick-action for the current settings page, shown on a settings page only. */
function SettingsFavoriteGroup({
  settingsPage, onClose,
}: {
  settingsPage: SettingsPage | null;
  onClose: () => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!settingsPage) return null;
  return (
    <>
      <CommandGroup heading={t("Current Page")}>
        <SettingsFavoriteCommandItem
          page={settingsPage}
          onDone={onClose}
        />
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}

/** The matched slug-routed entity's quick-action group, shown only when a route matched. */
function MatchedEntityGroup({
  entityCtx, taxonomy, setInputValue, onSelect, onAddChild, onClose,
}: {
  entityCtx: ReturnType<typeof useEntityCommandContext>;
  taxonomy: CommandPaletteTaxonomyState;
  setInputValue: (value: string) => void;
  onSelect: (path: string) => void;
  onAddChild: (kind: "tag" | "mediaType", parentId: string) => void;
  onClose: () => void;
}) {
  if (!entityCtx.matched) return null;
  return (
    <>
      <EntityCommandGroup
        matched={entityCtx.matched}
        onNavigate={onSelect}
        onEnterChoiceField={(field) => {
          taxonomy.enterEntityChoiceMode(field);
          setInputValue("");
        }}
        onAddChild={onAddChild}
        onClose={onClose}
      />
      <CommandSeparator />
    </>
  );
}

interface CommandPaletteDefaultViewProps {
  bookmarkFromHover: boolean;
  bookmarkTaxonomiesGroup: ReactNode;
  looksLikeUrl: boolean;
  inputValue: string;
  onAddBookmark: (url: string) => void;
  listingCtx: ReturnType<typeof useListingPageContext>;
  onClose: () => void;
  syncProvider: SyncProvider | null;
  isBookmarkViewPage: boolean;
  bookmarkId: string | null;
  bookmark: Bookmark | null | undefined;
  detailLayout: BookmarkDetailLayout;
  setDetailLayout: (layout: BookmarkDetailLayout) => void;
  settingsPage: SettingsPage | null;
  entityCtx: ReturnType<typeof useEntityCommandContext>;
  taxonomy: CommandPaletteTaxonomyState;
  setInputValue: (value: string) => void;
  onSelect: (path: string) => void;
  onAddChild: (kind: "tag" | "mediaType", parentId: string) => void;
  bookmarks: Bookmark[];
  onCreate: (kind: CreateKind) => void;
}

/**
 * The palette's default view (shown when no taxonomy sub-palette mode is active): the hovered/current
 * bookmark's quick-edit groups, quick-add, listing/current-page actions, entity quick-actions, and the
 * nav/search results. Extracted from `CommandPalette` — a coordinator's giant multi-section render is
 * the "per-group split" case (CLAUDE.md → Large-form / over-cap decomposition). Each conditional
 * section is further split into its own component (scored independently by fallow) rather than kept as
 * an inline `&&` guard, so the guard chain doesn't accumulate onto this coordinator either.
 */
export function CommandPaletteDefaultView({
  bookmarkFromHover,
  bookmarkTaxonomiesGroup,
  looksLikeUrl,
  inputValue,
  onAddBookmark,
  listingCtx,
  onClose,
  syncProvider,
  isBookmarkViewPage,
  bookmarkId,
  bookmark,
  detailLayout,
  setDetailLayout,
  settingsPage,
  entityCtx,
  taxonomy,
  setInputValue,
  onSelect,
  onAddChild,
  bookmarks,
  onCreate,
}: CommandPaletteDefaultViewProps) {
  return (
    <>
      {/* Hovered card's quick-edit commands float to the top of the palette. */}
      <BookmarkQuickEditGroups
        show={bookmarkFromHover}
        bookmarkTaxonomiesGroup={bookmarkTaxonomiesGroup}
      />

      <QuickAddGroup
        looksLikeUrl={looksLikeUrl}
        inputValue={inputValue}
        onAddBookmark={onAddBookmark}
      />

      <ListingPageCommandGroup
        listingCtx={listingCtx}
        onClose={onClose}
      />

      <SyncFromSourceGroup
        syncProvider={syncProvider}
        onClose={onClose}
      />

      <BookmarkViewGroup
        isBookmarkViewPage={isBookmarkViewPage}
        bookmarkId={bookmarkId}
        bookmark={bookmark}
        detailLayout={detailLayout}
        setDetailLayout={setDetailLayout}
        onClose={onClose}
      />

      {/* On a bookmark detail page the same group keeps its in-page position. */}
      <BookmarkQuickEditGroups
        show={!bookmarkFromHover}
        bookmarkTaxonomiesGroup={bookmarkTaxonomiesGroup}
      />

      <SettingsFavoriteGroup
        settingsPage={settingsPage}
        onClose={onClose}
      />

      <MatchedEntityGroup
        entityCtx={entityCtx}
        taxonomy={taxonomy}
        setInputValue={setInputValue}
        onSelect={onSelect}
        onAddChild={onAddChild}
        onClose={onClose}
      />

      <CommandPaletteNavGroups
        inputValue={inputValue}
        bookmarks={bookmarks}
        onSelect={onSelect}
        onAddBookmark={() => onAddBookmark("")}
        onCreate={onCreate}
      />
    </>
  );
}
