import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Link } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { AddChildModal } from "@/components/AddChildModal";
import { FavoriteMenuItem, PinMenuItem } from "@/components/header/headerMenuItems";
import { ListingCreateButton, ListingCreateMenuItems } from "@/components/header/ListingCreateControls";
import { HeaderPinButton } from "@/components/HeaderPinButton";
import { HeaderSettingsFavoriteButton } from "@/components/HeaderSettingsFavoriteButton";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import i18n from "@/i18n";

export function addChildAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.addChild) return null;
  const addChild = ctx.addChild;
  const label = addChild.kind === "tag" ? i18n.t("New sub-tag") : i18n.t("New sub-type");
  return {
    key: "add-child",
    desktop: (
      <AddChildButton
        kind={addChild.kind}
        parentId={addChild.parentId}
      />
    ),
    mobile: {
      kind: "modal",
      icon: Plus,
      label,
      disabled: !addChild.parentId,
      renderModal: (open, onOpenChange) => (
        <AddChildModal
          kind={addChild.kind}
          parentId={addChild.parentId}
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
