import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Link } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { AddChildModal } from "@/components/AddChildModal";
import { FavoriteMenuItem, FavoriteTaxonomyMenuItem, PinMenuItem } from "@/components/header/headerMenuItems";
import { ListingCreateButton, ListingCreateMenuItems } from "@/components/header/ListingCreateControls";
import { HeaderFavoriteButton } from "@/components/HeaderFavoriteButton";
import { HeaderPinButton } from "@/components/HeaderPinButton";
import { HeaderSettingsFavoriteButton } from "@/components/HeaderSettingsFavoriteButton";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import i18n from "@/i18n";

function addChildLabel(kind: "tag" | "mediaType" | "taxonomyTerm"): string {
  if (kind === "tag") return i18n.t("New sub-tag");
  if (kind === "mediaType") return i18n.t("New sub-type");
  return i18n.t("New sub-term");
}

/** Whether the current listing page renders its own Plus create control (which can host add-child). */
function listingRendersCreate(ctx: ToolbarContext): boolean {
  const listingPage = ctx.listingPage;
  return listingPage != null && (listingPage.addBookmark != null || listingPage.createAction != null);
}

export function addChildAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.addChild) return null;
  const addChild = ctx.addChild;
  const label = addChildLabel(addChild.kind);
  const disabled = addChild.kind === "taxonomyTerm"
    ? !addChild.parentId || !addChild.taxonomyId
    : !addChild.parentId;
  return {
    key: "add-child",
    // On a listing page the add-child is folded into that page's single Plus dropdown
    // (see `createListingAction`), so suppress the standalone desktop button to avoid two Plus
    // buttons. The small-screen More menu keeps it as its own row (its modal outlives the menu).
    desktop: listingRendersCreate(ctx) ? null : <AddChildButton {...addChild} />,
    mobile: {
      kind: "modal",
      icon: Plus,
      label,
      disabled,
      renderModal: (open, onOpenChange) => (
        <AddChildModal
          {...addChild}
          open={open}
          onOpenChange={onOpenChange}
        />
      ),
    },
  };
}

export function createListingAction(ctx: ToolbarContext): ToolbarAction | null {
  const listingPage = ctx.listingPage;
  if (!listingPage) return null;
  const {
    addBookmark, createAction, createLabel,
  } = listingPage;
  // Nothing to create from this listing page.
  if (addBookmark == null && createAction == null) return null;
  return {
    key: "create",
    desktop: (
      <ListingCreateButton
        addBookmark={addBookmark}
        createAction={createAction}
        createLabel={createLabel}
        // Fold the hierarchy-taxonomy "New sub-…" create into this single Plus dropdown (desktop).
        // The mobile More menu keeps it as its own row via `addChildAction`.
        addChild={ctx.addChild}
      />
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <ListingCreateMenuItems
          addBookmark={addBookmark}
          createAction={createAction}
          createLabel={createLabel}
        />
      ),
    },
  };
}

export function settingsFavoriteAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.settingsPage) return null;
  const settingsPage = ctx.settingsPage;
  return {
    key: "settings-favorite",
    desktop: <HeaderSettingsFavoriteButton page={settingsPage} />,
    mobile: {
      kind: "menuItem",
      node: <FavoriteMenuItem page={settingsPage} />,
    },
  };
}

export function favoriteTaxonomyAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.favoriteContext) return null;
  const favoriteContext = ctx.favoriteContext;
  return {
    key: "favorite-taxonomy",
    desktop: <HeaderFavoriteButton context={favoriteContext} />,
    mobile: {
      kind: "menuItem",
      node: <FavoriteTaxonomyMenuItem context={favoriteContext} />,
    },
  };
}

export function pinAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.pinContext) return null;
  const pinContext = ctx.pinContext;
  return {
    key: "pin",
    desktop: <HeaderPinButton context={pinContext} />,
    mobile: {
      kind: "menuItem",
      node: <PinMenuItem context={pinContext} />,
    },
  };
}

/**
 * The homepage's quick link to its settings. Rendered only on the homepage (`/`). Was previously an
 * inline gear link in the homepage body.
 */
export function homepageSettingsAction(ctx: ToolbarContext): ToolbarAction | null {
  if (ctx.pathParts.length > 0) return null;
  const homepageSettings = i18n.t("Homepage settings");
  return {
    key: "homepage-settings",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={homepageSettings}
        title={homepageSettings}
        asChild
      >
        <Link to="/settings/display/homepage">
          <Settings className="size-4" />
        </Link>
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem asChild>
          <Link to="/settings/display/homepage">
            <Settings className="size-4" />
            {homepageSettings}
          </Link>
        </DropdownMenuItem>
      ),
    },
  };
}
