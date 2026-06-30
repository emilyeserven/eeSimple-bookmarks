import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Link } from "@tanstack/react-router";
import { PanelRight, Plus, Settings } from "lucide-react";

import { AddChildButton } from "@/components/AddChildButton";
import { AddChildModal } from "@/components/AddChildModal";
import { FavoriteMenuItem, PinMenuItem } from "@/components/header/headerMenuItems";
import { HeaderPinButton } from "@/components/HeaderPinButton";
import { HeaderSettingsFavoriteButton } from "@/components/HeaderSettingsFavoriteButton";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function addChildAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.addChild) return null;
  const addChild = ctx.addChild;
  const label = addChild.kind === "tag" ? "New sub-tag" : "New sub-type";
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
  if (!ctx.listingPage?.createAction) return null;
  const createAction = ctx.listingPage.createAction;
  return {
    key: "create",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="New"
        onClick={createAction}
      >
        <Plus className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem onSelect={() => createAction()}>
          <Plus className="size-4" />
          New
        </DropdownMenuItem>
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
 * The homepage's quick link to its settings. Rendered only on the homepage (`/`), sitting just to the
 * left of the panel toggle so it reads as "next to the Right Drawer". Was previously an inline gear
 * link in the homepage body.
 */
export function homepageSettingsAction(ctx: ToolbarContext): ToolbarAction | null {
  if (ctx.pathParts.length > 0) return null;
  return {
    key: "homepage-settings",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Homepage settings"
        title="Homepage settings"
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
            Homepage settings
          </Link>
        </DropdownMenuItem>
      ),
    },
  };
}

export function openPanelAction(ctx: ToolbarContext): ToolbarAction {
  return {
    key: "open-panel",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open panel"
        onClick={ctx.openPanel}
      >
        <PanelRight className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "standalone",
    },
  };
}
