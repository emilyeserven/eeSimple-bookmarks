import type { ToolbarAction, ToolbarContext } from "./toolbarActionTypes";

import { BulkSelectMenuItem, HeaderBulkSelectButton } from "@/components/header/HeaderBulkSelectButton";

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
