import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { Eye } from "lucide-react";

import { DisplayOptionsPopover } from "@/components/DisplayOptionsPopover";
import { BulkSelectMenuItem, HeaderBulkSelectButton } from "@/components/header/HeaderBulkSelectButton";
import { ListingDisplayControls } from "@/components/ListingDisplayControls";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import i18n from "@/i18n";

export function displayOptionsAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.listingPage) return null;
  const pageKey = ctx.listingPage.key;
  return {
    key: "display-options",
    desktop: <DisplayOptionsPopover pageKey={pageKey} />,
    mobile: {
      kind: "modal",
      icon: Eye,
      label: i18n.t("Display"),
      renderModal: (open, onOpenChange) => (
        <ResponsivePopover
          title={i18n.t("Display")}
          open={open}
          onOpenChange={onOpenChange}
        >
          <ListingDisplayControls pageKey={pageKey} />
        </ResponsivePopover>
      ),
    },
  };
}

export function bulkSelectAction(ctx: ToolbarContext): ToolbarAction | null {
  if (!ctx.bulkSelectPageKey) return null;
  const pageKey = ctx.bulkSelectPageKey;
  return {
    key: "bulk-select",
    desktop: <HeaderBulkSelectButton pageKey={pageKey} />,
    mobile: {
      kind: "menuItem",
      node: <BulkSelectMenuItem pageKey={pageKey} />,
    },
  };
}
